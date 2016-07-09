"use strict";
var mockRecorder = require('./index.js');
var complicatedLibThatIsNotPartOfThisTest = {
    a: 3,
    b: function (a, b) {
        return a + b;
    }
};
var recorder = mockRecorder.recorder(complicatedLibThatIsNotPartOfThisTest, "test");

console.log(recorder.a);        // 3
console.log(recorder.b(1,3));   // 4
console.log(recorder.b(5,3));   // 8


// now, lets use our mock:

var mock = mockRecorder.replay('test');


console.log(mock.a);        // 3
console.log(mock.b(1,3));   // 4
console.log(mock.b(5,3));   // 8

