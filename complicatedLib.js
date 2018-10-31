module.exports = {
    a: 3,
    b: function (a, b) {
        "use strict";
        return a * b;
    },
    c: function() {
        "use strict";
        return new Date('2000-01-01');
    },
    d: function() {
      "use strict";
      return new Date('2018-10-29T15:24:01.123Z');
    }
}

console.log("#".repeat(34));
console.log("#".repeat(5) + ' complicated lib loaded ' + ('#'.repeat(5)));
console.log("#".repeat(34));
