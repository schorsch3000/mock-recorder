"use strict";
var mockRecorder = require('../../../../index.js');

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
        unrecordedChild: "unknown",
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


describe("mockrecorder", function () {
    var recorder = mockRecorder.recorder("mockRecorderConcurrent.spec.js", objectToMock, 'test');


    it("should get the long storagePath right",function(){
        var expectedPath=__filename.replace(/\\/g,'/').replace('/spec/','/mockStorage/').replace(/\.js$/,'.json');

        console.log(mockRecorder.getStoragePath())
        console.log(expectedPath)
        expect(mockRecorder.getStoragePath()).toBe(expectedPath);
    })
});
//'/Volumes/external/git/mock-recorder/mockStorage/foo/bar/baz/mockRecorder.spec.json' to be
//'/Volumes/external/git/mock-recorder/mockStorage/example.spec.json'.
