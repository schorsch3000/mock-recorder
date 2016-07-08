"use strict";
var util = require('util');

function md5(string) {
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string).digest('hex');
}

module.export = {}
var recordings = {};
var recorder = function (obj, name) {
    var prox = Proxy.create({
        keys: function () {
            recordings[name] = recordings[name] || {};
            recordings[name]['$keys'] = Object.keys(obj);
            return recordings[name]['$keys']

        },
        getOwnPropertyDescriptor: function () {
            recordings[name] = recordings[name] || {};
            recordings[name]['$getOwnPropertyDescriptor'] = Object.getOwnPropertyDescriptor(obj);

            return recordings[name]['$getOwnPropertyDescriptor'];
        },

        get: function (me, keyName) {

            recordings[name] = recordings[name] || {};
            recordings[name][keyName] = recordings[name][keyName] || {};
            var retVal = obj[keyName];
            if (retVal === null) {

                recordings[name][keyName].type = "null";
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
                }
            } else {
                recordings[name][keyName].type = "scalar";
                recordings[name][keyName].value = retVal;
                return retVal;
            }
        }
    });
    if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
            //preloading
            prox[i];
        }
    }
    return prox;
}


var replay = function (name, body) {
    var mock = body || {};
    for (var k in recordings[name]) {
        var v = recordings[name][k];
        if (v.type === 'scalar') {
            mock[k] = v.value
        } else if (v.type === 'function') {
            mock[k] = (function (args, name, k) {
                return function () {
                    var key = md5(JSON.stringify(arguments));
                    if (!(key in args)) {
                        var prettyArgs = []
                        for (var i = 0; i < arguments.length; i++) {
                            prettyArgs.push(JSON.stringify(arguments[i]));
                        }
                        throw "You don't have recorded " + k +
                        '(' + prettyArgs.join(', ') + ')' + " in suite " + name
                    }
                    return args[key];
                }
            })(v.values, name, k);
        } else if (v.type === 'object') {
            mock[k] = replay(name + '.' + k)
        } else if (v.type === 'null') {
            mock[k] = null;
        } else if (v.type === 'array') {
            mock[k] = replay(name + '.' + k, [])

        }
    }
    return mock;


};


module.exports.replay = replay;
module.exports.recorder = recorder;
module.exports.getRecordings = function () {
    return recordings;
};
module.exports.setRecordings = function (rec) {
    return recordings = rec;
};
module.exports.clearRecordings = function () {
    return recordings = {};
};