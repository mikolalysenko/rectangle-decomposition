"use strict"

var decomp = require("../decomp")
var tape = require("tape")
var contour = require("contour-2d")
var pack = require("ndarray-pack")
var boxOverlap = require("boxoverlap")

tape("rectilinear-decomposition", function(t) {

  function verifyDecomp(paths, ccw, expected) {
    var rectangles = decomp(paths, ccw)
    if(typeof expected !== "undefined") {
      t.equals(rectangles.length, expected, "expected number of boxes")
    }
    t.same(boxOverlap(rectangles).filter(function(x) {
      var a = rectangles[x[0]]
      var b = rectangles[x[1]]
      var x = Math.min(a[1][0], b[1][0]) - Math.max(a[0][0], b[0][0])
      if(x <= 0) {
        return false
      }
      var y = Math.min(a[1][1], b[1][1]) - Math.max(a[0][1], b[0][1])
      if(y <= 0) {
        return false
      }
      return true
    }), [], "non-overlap")

    //Compute area for polygon and check each path is covered by an edgeo of 
    var area = 0.0
    for(var i=0; i<paths.length; ++i) {
      for(var j=0; j<paths[i].length; ++j) {
        var a = paths[i][j]
        var b = paths[i][(j+1)%paths[i].length]
        if(a[1] === b[1]) {
          area += (b[0] - a[0]) * a[1]
        }
      }
    }
    if(!ccw) {
      area = -area
    }

    //Compute area for boxes
    var boxarea = 0.0
    for(var i=0; i<rectangles.length; ++i) {
      var r = rectangles[i]
      boxarea += (r[1][0] - r[0][0]) * (r[1][1] - r[0][1])
      t.ok(r[0][0] < r[1][0], "checking bounds consistent")
      t.ok(r[0][1] < r[1][1], "checking bounds consistent")
    }
    t.same(boxarea, area, "areas match")

    //TODO: Add more tests here?
  }

  function test(paths, ccw, expected) {
    //Check all 4 orientations
    for(var sx=1; sx>=-1; sx-=2)
    for(var sy=1; sy>=-1; sy-=2)
    {
      var npaths = paths.map(function(path) {
        return path.map(function(v) {
          return [sx * v[0], sy * v[1]]
        })
      })
      var nccw = sx * sy < 0 ? !ccw : ccw
      verifyDecomp(npaths, nccw, expected)
    }
  }

  //Test with a bitmap image  
  function bmp(image, expected) {
    var paths = contour(pack(image), true)
    test(paths, false, expected)
  }

  bmp([
    [1]
    ], 1)

  bmp([
    [1, 0, 1],
    [1, 1, 1]
    ], 3)

  bmp([
    [1, 1, 0, 1],
    [0, 1, 1, 1]
    ], 3)

  bmp([
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1]
    ], 5)

  bmp([
    [1,1,1,1,1],
    [1,0,1,0,1],
    [1,1,1,1,1]], 5)

  bmp([
      [0, 1, 0, 0],
      [0, 1, 1, 1],
      [0, 1, 0, 1],
      [1, 1, 1, 1]
    ], 4)

  bmp([
      [1, 1, 0, 0],
      [0, 1, 1, 1],
      [0, 1, 0, 1],
      [0, 1, 1, 1]
    ], 5)

  bmp([
      [1, 1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0, 1],
      [0, 1, 0, 1, 0, 1],
      [0, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 1]
    ])

  bmp([
      [0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0],
      [1, 0, 0, 1, 0, 0]
    ], 5)

  bmp([
      [0, 1, 0, 1, 0],
      [1, 1, 0, 1, 1],
    ], 4)
  
  bmp([
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0],
      [0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ], 29)

  // *-*
  // | |
  // * |
  // | |
  // *-*
  test([
      [[0,0], [0,1], [0,2], [1,2], [1,0]]
    ], true, 1)

  //   *-*
  //   | |
  // *-*-*
  // | |
  // *-*
  test([
      [[0,0], [0,1], [1,1], [1,0]],
      [[1,1], [1,2], [2,2], [2,1]]
    ], true, 2)

  //   *---*
  //   |   |
  // *-*-* |
  // | | | |
  // | *-* |
  // |     |
  // *-----*
  test([
    [[0,0], [3,0], [3,3], [1,3], [1,2], [2,2], [2,1], [1,1], [1,2], [0,2]]
    ], false, 4)

  //   *-----*
  //   |     |
  // *-*     |
  // |       |
  // | *-*   |
  // | | |   |
  // | *-*   |
  // |       |
  // *-------*
  test([
      [[1,1], [1,2], [2,2], [2,1]],
      [[0,0], [4,0], [4,4], [1,4], [1,3], [0,3]]
    ], false, 4)


  //   *-*
  //   | |
  // *-* *-*
  // |     |
  // *-* *-*
  //   | |
  //   *-*
  var plus = [
    [1, 1],
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 3],
    [2, 2],
    [3, 2],
    [3, 1],
    [2, 1],
    [2, 0],
    [1, 0]
  ]
  test([plus], true, 3)

  // *---*
  // |   |
  // *-* *-*
  //   |   |
  //   *---*
  var zigZag = [
    [1,1],
    [0,1],
    [0,2],
    [2,2],
    [2,1],
    [3,1],
    [3,0],
    [1,0]
  ]
  test([zigZag], true, 2)
  
  //    *-*
  //    | |
  //  *-* *-*
  //  |     |
  //  *-----*
  var bump = [
    [0,0],
    [0,1],
    [1,1],
    [1,2],
    [2,2],
    [2,1],
    [3,1],
    [3,0]
  ]
  test([bump], true, 2)

  //   *-*
  //   | |  
  // *-* |
  // |   |
  // *---*
  var bracket = [
    [0,0],
    [0,1],
    [1,1],
    [1,2],
    [2,2],
    [2,0]
  ]
  test([bracket], true, 2)
  
  t.end()
})