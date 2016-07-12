/*jshint esversion: 6 */
"use strict";
var util = require('util');
var fs = require('fs-extra');
var path = require('path');
function md5(string) {
    "use strict";
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string).digest('hex');
}
module.export = {};
var recordings = {};
var recorder = function (file, obj, name) {
    "use strict";
    var prox = Proxy.create({
        keys: function () {
            if (undefined === recordings[file]) {
                recordings[file] = [];
            }
            if (undefined === recordings[file][name]) {
                recordings[file][name] = {};
            }
            recordings[file][name].__keys = Object.keys(obj);
            return recordings[file][name].__keys;

        },
        getOwnPropertyDescriptor: function () {
            recordings[file][name] = recordings[file][name] || {};
            recordings[file][name].__getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor(obj);

            return recordings[file][name].__getOwnPropertyDescriptor;
        },

        get: function (me, keyName) {
            recordings[file] = recordings[file] || [];
            recordings[file][name] = recordings[file][name] || {};
            recordings[file][name][keyName] = recordings[file][name][keyName] || {};
            var retVal = obj[keyName];
            if (retVal === null) {
                recordings[file][name][keyName].type = "null";
                return null;
            } else if (typeof retVal === 'object' && retVal instanceof Date) {
                recordings[file][name][keyName].type = "date";
                recordings[file][name][keyName].value = retVal;
                return retVal;

            } else if (typeof retVal === 'object' && retVal instanceof Array) {
                recordings[file][name][keyName].type = "array";
                for (var i = 0; i < retVal.length; i++) {
                    return recorder(file, retVal, name + '.' + keyName);
                }

            } else if (typeof retVal === 'object') {
                recordings[file][name][keyName].type = "object";
                return recorder(file, retVal, name + '.' + keyName);
            } else if (typeof retVal === 'function') {
                recordings[file][name][keyName].type = "function";
                recordings[file][name][keyName].values = recordings[file][name][keyName].values || {};
                return function () {
                    var wrapperRetVal = obj[keyName](...arguments);
                    var key = md5(JSON.stringify(arguments));
                    recordings[file][name][keyName].values[key] = wrapperRetVal;
                    return wrapperRetVal;
                };
            } else {
                recordings[file][name][keyName].type = "scalar";
                recordings[file][name][keyName].value = retVal;
                return retVal;
            }
        }
    });
    if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
            /* jshint ignore:start */
            // we are loading array values via proxy, that results in a method-call, this is not useless!
            prox[i];
            /* jshint ignore:end */

        }
    }

    return prox;
};


var replay = function (file, name, body) {
    var mock = body || {};
    for (var k in recordings[file][name]) {
        var v = recordings[file][name][k];
        if (v.type === 'scalar') {
            mock[k] = v.value;
        } else if (v.type === 'function') {
            // js-hint tells us not to make a function in a loop.
            // but that's what we need here, we need to fill an object with methods.
            // that is bad in production code, but we are generating a mock object for testing...
            mock[k] = (function (args, name, k) { // jshint ignore:line
                return function () {
                    var key = md5(JSON.stringify(arguments));
                    if (!(key in args)) {
                        var prettyArgs = [];
                        for (var i = 0; i < arguments.length; i++) {
                            prettyArgs.push(JSON.stringify(arguments[i]));
                        }
                        throw new Error("You don't have recorded " + k +
                            '(' + prettyArgs.join(', ') + ')' + " in suite " + name);
                    }
                    return args[key];
                };
            })(v.values, name, k);
        } else if (v.type === 'object') {
            mock[k] = replay(file, name + '.' + k);
        } else if (v.type === 'null') {
            mock[k] = null;
        } else if (v.type === 'array') {
            mock[k] = replay(file, name + '.' + k, []);

        } else if (v.type === 'date') {
            mock[k] = new Date(v.value);
        }
    }

    return mock;
};

module.exports.replay = replay;
module.exports.recorder = recorder;

var getRecordings = module.exports.getRecordings = function (file) {
    return recordings[file];
};
var setRecordings = module.exports.setRecordings = function (file, rec) {
    return (recordings[file] = rec);
};
module.exports.clearRecordings = function (file) {
    if(file) {
      return (recordings[file] = {});
    }
    else {
      return (recordings[file] = [])
    }
};

var config = module.exports.config = {
    storagePath: './mockStorage',
    testFolderName: 'spec'
};

var getStoragePath = module.exports.getStoragePath = function () {
    "use strict";
    fs.ensureDirSync(config.storagePath);
    var storagePath = [];
    var storagePathPrefix = fs.realpathSync(config.storagePath).replace(/\\/g, '/').split('/');
    console.log('\n' + module.parent.filename)
    var modulePath = module.parent.filename.replace(/\\/g, '/').split('/');

    var segment;
    while ((segment = modulePath.pop()) !== config.testFolderName) {
        storagePath.unshift(segment);
    }

    storagePath.push(path.basename(storagePath.pop(), '.js') + '.json');
    storagePath = storagePath.join('/');
    storagePath = storagePathPrefix.join('/') + '/' + storagePath;

    var storageDir = storagePath.split('/');
    storageDir.pop();
    storageDir = storageDir.join('/');
    fs.ensureDirSync(storageDir);

    return storagePath;

};

class MockReplayer {
  constructor(mode, dependencyName, dependencyCallback) {
    this.storagePath = getStoragePath();

    if (mode === 'replay') {
        this.setRecordings(this.storagePath, fs.readJsonSync(this.storagePath));
        return replay(this.storagePath, dependencyName);
    } else if (mode === 'record') {
        storagePath = getStoragePath();
        return recorder(this.storagePath, dependencyCallback(), dependencyName);
    } else {
        throw new Error("mode should me either record or replay");
    }
  }

  save() {
    if (this.storagePath) {
        fs.writeJsonSync(this.storagePath, getRecordings(this.storagePath));
    }
  }
}

module.exports.Wrapper = MockReplayer;

//The following is a workaround to make "module.parent" be the actual module
//that required this file and not the module that required it first
delete require.cache[__filename];
