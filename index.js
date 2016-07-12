/*jshint esversion: 6 */
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
var recorder = function (obj, name) {
    "use strict";
    var prox = Proxy.create({
        keys: function () {
            if (undefined === recordings[name]) {
                recordings[name] = {};
            }
            recordings[name].__keys = Object.keys(obj);
            return recordings[name].__keys;

        },
        getOwnPropertyDescriptor: function () {
            recordings[name] = recordings[name] || {};
            recordings[name].__getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor(obj);

            return recordings[name].__getOwnPropertyDescriptor;
        },

        get: function (me, keyName) {
            recordings[name] = recordings[name] || {};
            recordings[name][keyName] = recordings[name][keyName] || {};
            var retVal = obj[keyName];
            if (retVal === null) {
                recordings[name][keyName].type = "null";
                return null;
            } else if (typeof retVal === 'object' && retVal instanceof Array) {
                recordings[name][keyName].type = "array";
                for (var i = 0; i < retVal.length; i++) {
                    return recorder(retVal, name + '.' + keyName);
                }

            } else if (typeof retVal === 'object') {
                recordings[name][keyName].type = "object";
                return recorder(retVal, name + '.' + keyName);
            } else if (typeof retVal === 'function') {
                recordings[name][keyName].type = "function";
                recordings[name][keyName].values = recordings[name][keyName].values || {};
                return function () {
                    var wrapperRetVal = obj[keyName](...arguments);
                    var key = md5(JSON.stringify(arguments));
                    recordings[name][keyName].values[key] = wrapperRetVal;
                    return wrapperRetVal;
                };
            } else {
                recordings[name][keyName].type = "scalar";
                recordings[name][keyName].value = retVal;
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


var replay = function (name, body) {
    var mock = body || {};
    for (var k in recordings[name]) {
        var v = recordings[name][k];
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
            mock[k] = replay(name + '.' + k);
        } else if (v.type === 'null') {
            mock[k] = null;
        } else if (v.type === 'array') {
            mock[k] = replay(name + '.' + k, []);

        }
    }
    return mock;


};


module.exports.replay = replay;
module.exports.recorder = recorder;
var getRecordings = module.exports.getRecordings = function () {
    return recordings;
};
var setRecordings = module.exports.setRecordings = function (rec) {
    return (recordings = rec);
};
module.exports.clearRecordings = function () {
    return (recordings = {});
};
var config = module.exports.config = {
    storagePath: './mockStorage',
    testFolderName: 'spec'

};

var getStoragePath=module.exports.getStoragePath= function () {
    "use strict";
    fs.ensureDirSync(config.storagePath);
    var storagePath=[];
    var storagePathPrefix= fs.realpathSync(config.storagePath).split('/');
    var modulePath = module.parent.filename.replace(/\\/g,'/').split('/');

    var segment;
    while ((segment = modulePath.pop()) !== config.testFolderName) {
        storagePath.unshift(segment);
    }

    storagePath.push(path.basename(storagePath.pop(), '.js') + '.json');
    storagePath = storagePath.join('/');
    storagePath=storagePathPrefix.join('/')+'/'+storagePath;

    var storageDir = storagePath.split('/');
    storageDir.pop();
    storageDir = storageDir.join('/');
    fs.ensureDirSync(storageDir);

    return storagePath;

};

var storagePath;

module.exports.wrapper = function (mode, dependencyName, dependencyCallback) {
    "use strict";
    if (mode === 'replay') {
        setRecordings(fs.readJsonSync(getStoragePath()));
        return replay(dependencyName);
    } else if (mode === 'record') {
        storagePath = getStoragePath();
        return recorder(dependencyCallback(), dependencyName);
    } else {
        throw new Error("mode should me either record or replay");
    }


};

module.exports.saveWrapper = function () {
    if (storagePath) {
        fs.writeJsonSync(storagePath, getRecordings());
    }
};