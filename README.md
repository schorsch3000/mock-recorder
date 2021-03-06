# mock-recorder
Travis (linux/osx) ![Build-Status](https://api.travis-ci.org/schorsch3000/mock-recorder.svg "Build-Status")

appveyor (windows) ![Build-Status](https://ci.appveyor.com/api/projects/status/github/schorsch3000/mock-recorder?svg=true "Build-Status")

![dependecy-status](https://david-dm.org/schorsch3000/mock-recorder/dev-status.svg "dependecy-status")

![dependecy-status](https://david-dm.org/schorsch3000/mock-recorder.svg "dependecy-status")

![Code Coverage](https://codecov.io/gh/schorsch3000/mock-recorder/branch/master/graph/badge.svg "coverage")


Generate mock-objects by recording usage of the real Object.

See example.js or tests for usage.

```javascript

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

```

There is spec/example.spec.js, that's not a real test but an example on how to use the convenience wrapper in your tests.
You should run the test once in 'record' mode. It will store the mocking-data in ./mockStorage.
Running the same test again in 'replay' mode will result in running with a mocked object. the whole lib will not be loaded.


While working on your test's you should run in record mode, assuming your dependency works as intended.
When your test is done, switch to replay mode; dont forget to commit your mock-data.



## TODO
Automagically generate a test for the mocked object from the mocking-data.
