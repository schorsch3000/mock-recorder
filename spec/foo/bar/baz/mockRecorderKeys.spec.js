"use strict";
var mockRecorder = require('../../../../index.js');
var objectToMock = {
    a:1,b:2
};
describe("mockrecorder", function () {
    var rec=mockRecorder.recorder(objectToMock, 'test');
    it("should set up internal data correct if keys is called at first", function () {
        expect(Object.keys(rec)).toEqual([ 'a', 'b' ]);
    })
});
