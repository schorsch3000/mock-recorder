var should = require('should');
"use strict";
var mockRecorder = require('../index.js');

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
    var recorder = mockRecorder.recorder(objectToMock, 'test');

    it("should proxy Object.keys()", function () {
        expect(Object.keys(recorder)).toEqual(['null', 'number', 'string', 'function_get', 'function_call', 'booleanTrue', 'booleanFalse', 'undef_set', 'NaN', 'array', 'obj', 'arrayInArrayInArray', 'unrecorded']);
    });
    it("should proxy null", function () {
        expect(recorder.null).toBe(null);
    });
    it("should proxy a boolean", function () {
        expect(recorder.booleanTrue).toBe(true);
        expect(recorder.booleanFalse).toBe(false);
    });
    it("should proxy a number", function () {
        expect(recorder.number).toBe(1);
    });
    it("should proxy a string", function () {
        expect(recorder.string).toBe('ww');
    });
    it("should proxy a function", function () {
        expect(typeof recorder.function_get).toBe('function')
    });
    it("should proxy a function thats callable", function () {
        expect(recorder.function_call(2, 1)).toBe(3)
    });
    it("should proxy undefined values", function () {
        expect(recorder.undef_set).toBeUndefined()
        expect(recorder.undef_literaly).toBeUndefined()
    });
    it("should proxy NaN values", function () {
        expect(recorder.NaN).toBeNaN()
    });
    it("should proxy Arrays", function () {
        expect(typeof recorder.array).toBe('object')
        expect(recorder.array.length).toBe(3)
        expect(recorder.array[0]).toBe(1)
        expect(recorder.array[1]).toBe(2)
        expect(recorder.array[2]).toBe(3)
        expect(recorder.array[3]).toBeUndefined()
    });
    it("should proxy Objects and its children", function () {
        expect(typeof recorder.obj).toBe('object')
        expect(recorder.obj.nestedNumber).toBe(2);
        expect(recorder.obj.nestedFunction(2, 10)).toBe(20);
        expect(recorder.obj.nestedObj.nestedNestedNumber).toBe(1);
    });
    it("should proxy Object.keys()", function () {
        expect(Object.keys(recorder)).toEqual(['null', 'number', 'string', 'function_get', 'function_call', 'booleanTrue', 'booleanFalse', 'undef_set', 'NaN', 'array', 'obj', 'arrayInArrayInArray', 'unrecorded']);
    });


    it("should replay null", function () {
        var replay = mockRecorder.replay('test');
        expect(replay.null).toBe(null);
    });
    it("should replay a boolean", function () {
        var replay = mockRecorder.replay('test');
        expect(replay.booleanTrue).toBe(true);
        expect(replay.booleanFalse).toBe(false);
    });
    it("should replay a number", function () {
        var replay = mockRecorder.replay('test');
        expect(replay.number).toBe(1);
    });
    it("should replay a string", function () {
        var replay = mockRecorder.replay('test');
        expect(replay.string).toBe('ww');
    });
    it("should replay a function", function () {
        var replay = mockRecorder.replay('test');

        expect(typeof replay.function_get).toBe('function')
    });
    it("should replay a function that's callable and recorded", function () {
        var replay = mockRecorder.replay('test');
        expect(replay.function_call(2, 1)).toBe(3)
    });

    it("should fail for unrecorded function calls", function () {
        var replay = mockRecorder.replay('test');
        expect(function () {
            replay.function_call(99, 88)
        }).toThrow(new Error("You don't have recorded function_call(99, 88) in suite test"))
    });

    it("should replay undefined values", function () {
        var replay = mockRecorder.replay('test');

        expect(replay.undef_set).toBeUndefined();
        expect(replay.undef_literaly).toBeUndefined();
    });
    it("should replay NaN values", function () {
        var replay = mockRecorder.replay('test');

        expect(replay.NaN).toBeNaN();
    });
    it("should replay Arrays", function () {
        var replay = mockRecorder.replay('test');

        expect(typeof replay.array).toBe('object');
        expect(replay.array.length).toBe(3);
        expect(replay.array[0]).toBe(1);
        expect(replay.array[1]).toBe(2);
        expect(replay.array[2]).toBe(3);
        expect(replay.array[3]).toBeUndefined();
    });
    it("should replay Objects and it's recorded children", function () {
        var replay = mockRecorder.replay('test');

        expect(typeof replay.obj).toBe('object');
        expect(replay.obj.unrecordedChild).toBeUndefined();
        expect(replay.obj.nestedNumber).toBe(2);
        expect(replay.obj.nestedFunction(2, 10)).toBe(20);
        expect(replay.obj.nestedObj.nestedNestedNumber).toBe(1);
    });

    it("should clear it's recordings", function () {
        mockRecorder.clearRecordings();
        var replay = mockRecorder.replay('test');
        expect(replay).toEqual({});
    })
    it("should export it's recordings", function () {
        mockRecorder.clearRecordings();
        var recorder = mockRecorder.recorder({a: 1}, 'export');
        recorder.a;
        expect(mockRecorder.getRecordings()).toEqual({export: {a: {type: 'scalar', value: 1}}});
    })
    it("should import  recordings", function () {
        mockRecorder.clearRecordings();
        mockRecorder.setRecordings({import: {a: {type: 'scalar', value: 2}}})
        expect(mockRecorder.replay('import').a).toBe(2)
    })
    it("should proxy Object.getOwnPropertyDescriptor()", function () {
        expect(Object.getOwnPropertyDescriptor(recorder)).toBeUndefined()
    });
});
