"use strict";
var mockRecorder = require('./index.js');
var objectToMock = {
    null: null,
    number: 1,
    string: "ww",
    function_get: function () {
    },
    function_call: function (a, b) {
        return a + b
    },
    booleanTrue: true,
    booleanFalse: false,
    undef_set: undefined,
    NaN: 0 / 0,
    array: [1, 2, 3],
    obj: {
        nestedNumber: 2,
        nestedFunction: function (a, b) {
            return a * b;
        },
        nestedObj: {nestedNestedNumber: 1},
        nestedArray: [1, 2, {nestception: 33}],
        nestedArrayWithObjGet: [1, 2, {nestception: 33}]

    },
    arrayInArrayInArray: [[[]]],
    unrecorded: "Unrecorded values won't be part of the mock-replay"
};
var mockProxy = mockRecorder.recorder(objectToMock, "test", "teststate");

// let's record some properties
mockProxy.null;
mockProxy.number;
mockProxy.string;
mockProxy.function_get
mockProxy.function_call(1, 2);
mockProxy.function_call(3, 6);
mockProxy.function_call(4, 9);
mockProxy.function_call(5, 21);
mockProxy.function_call(6, 23);
mockProxy.function_call(7, 42);
mockProxy.booleanTrue;
mockProxy.booleanFalse;
mockProxy.undef_set;
mockProxy.undef_literaly;
mockProxy.NaN;
mockProxy.obj.nestedNumber;
mockProxy.obj.nestedFunction(1, 2);
mockProxy.obj.nestedObj.nestedNestedNumber;
mockProxy.obj.nestedArray;
mockProxy.obj.nestedArrayWithObjGet[2].nestception; // yes, intellij is able to autohint this!
mockProxy.array;
mockProxy.arrayInArrayInArray;


var mock = mockRecorder.replay('test');

console.log(Object.keys(mock))

// have a look at your objects ans scalars
console.log(mock);

// lets check some valid function calls

console.log("calling recorded function call with known args: ", mock.function_call(1, 2));
console.log("calling recorded function call with known args: ", mock.function_call(3, 6));
console.log("calling recorded function call with known args: ", mock.function_call(4, 9));
console.log("calling recorded function call with known args: ", mock.function_call(5, 21));
console.log("calling recorded function call with known args: ", mock.function_call(6, 23));
console.log("calling recorded function call with known args: ", mock.function_call(7, 42));
console.log("calling recorded nested function call with known args: ", mock.obj.nestedFunction(1, 2));

// and some invalid ones
try {
    console.log("calling UNrecorded function call ", mock.unknown("we never called this"));
} catch (e) {
    console.log("It throws: ", e)
}
try {
    console.log("calling recorded function call with UNknown args: ", mock.function_call(2, 1));
} catch (e) {
    console.log("It throws: ", e)
}


mockRecorder.clearRecordings();
mockRecorder.recorder({a: 3}, "export").a
console.log("get an export of a recording: ",mockRecorder.getRecordings());
mockRecorder.setRecordings({import: {imported: {type: 'scalar', value: "it works!"}}});
console.log("get a replay of an imported recording:",mockRecorder.replay('import'));
