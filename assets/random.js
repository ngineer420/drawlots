/*
 * drawlots.net — cryptographically-strong randomness helpers.
 * Every chance outcome on this site traces back to crypto.getRandomValues.
 * Math.random() is never used, anywhere.
 */
(function (global) {
  "use strict";

  function randomUint32() {
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }

  // Uniform random integer in [min, max], inclusive, rejection-sampled so
  // the result has no modulo bias.
  function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (max < min) {
      var t = min;
      min = max;
      max = t;
    }
    var range = max - min + 1;
    if (range <= 1) return min;
    var maxUint32 = 0xffffffff;
    var limit = maxUint32 - (maxUint32 % range);
    var x;
    do {
      x = randomUint32();
    } while (x >= limit);
    return min + (x % range);
  }

  // Uniform random float in [0, 1).
  function randomFloat() {
    return randomUint32() / 4294967296;
  }

  // Uniform random float in [min, max).
  function randomFloatRange(min, max) {
    return min + randomFloat() * (max - min);
  }

  function pick(arr) {
    return arr[randomInt(0, arr.length - 1)];
  }

  // Fisher-Yates shuffle using crypto randomness. Returns a new array.
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randomInt(0, i);
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  global.DrawlotsRandom = {
    int: randomInt,
    float: randomFloat,
    floatRange: randomFloatRange,
    pick: pick,
    shuffle: shuffle,
  };
})(window);
