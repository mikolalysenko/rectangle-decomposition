"use strict"

var decomp = require("../decomp")
var tape = require("tape")

tape("rectilinear-decomposition", function(t) {

  console.log(decomp([
      [[1,1], [1,2], [2,2], [2,1]],
      [[0,0], [4,0], [4,4], [1,4], [1,3], [0,3]]
    ]))

  t.end()
})