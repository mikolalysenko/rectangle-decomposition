"use strict"

var bipartiteIndependentSet = require("bipartite-independent-set")
var createIntervalTree = require("interval-tree-1d")
var util = require("util")
var dup = require("dup")

module.exports = decomposeRegion

function Vertex(point, path, index, concave) {
  this.point = point
  this.path = path
  this.index = index
  this.concave = concave
  this.next = null
  this.prev = null
  this.visited = false
}

function Segment(start, end, direction) {
  var a = start.point[direction^1]
  var b = end.point[direction^1]
  if(a < b) {
    this[0] = a
    this[1] = b
  } else {
    this[0] = b
    this[1] = a
  }
  this.start = start
  this.end = end
  this.direction = direction
  this.number = -1
}

function testSegment(a, b, tree, direction) {
  return !!tree.queryPoint(a.point[direction], function(s) {
    var x = s.start[direction]
    if(a.point[direction] < x && x < b.point[direction]) {
      return true
    }
    return false
  })
}

function getDiagonals(vertices, paths, direction, tree) {
  var concave = []
  for(var i=0; i<vertices.length; ++i) {
    if(vertices[i].concave) {
      concave.push(vertices[i])
    }
  }
  concave.sort(function(a,b) {
    var d = a.point[direction] - b.point[direction]
    if(d) {
      return d
    }
    return a.point[direction^1] - b.point[direction^1]
  })
  var diagonals = []
  for(var i=1; i<concave.length; ++i) {
    var a = concave[i-1]
    var b = concave[i]
    if(a.point[direction] === b.point[direction]) {
      if(a.path === b.path) {
        var n = paths[a.path].length
        var d = (a.index-b.index+n) % n
        if(d === 1 || d === n-1) {
          continue
        }
      }
      if(!testSegment(a, b, tree, direction)) {
        diagonals.push(new Segment(a, b, direction))
      }
    }
  }
  return diagonals
}

//Find all crossings between diagonals
function findCrossings(hdiagonals, vdiagonals) {
  var htree = createIntervalTree(hdiagonals)
  var crossings = []
  for(var i=0; i<vdiagonals.length; ++i) {
    var v = vdiagonals[i]
    htree.queryPoint(v.start[1], function(h) {
      var x = h.start[0]
      if(v[0] < x && x < v[1]) {
        crossings.push([v, h])
      }
    })
  }
  return crossings
}

function findSplitters(hdiagonals, vdiagonals) {
  //First find crossings
  var crossings = findCrossings(hdiagonals, vdiagonals)

  //Then tag and convert edge format
  for(var i=0; i<hdiagonals.length; ++i) {
    hdiagonals[i].number = i
  }
  for(var i=0; i<vdiagonals.length; ++i) {
    vdiagonals[i].number = i
  }
  var edges = crossings.map(function(c) {
    return [ c[0].number, c[1].number ]
  })

  //Find independent set
  var selected = bipartiteIndependentSet(hdiagonals.length, vdiagonals.length, edges)

  //Convert into result format
  var result = new Array(selected[0].length + selected[1].length)
  var ptr = 0
  for(var i=0; i<selected[0].length; ++i) {
    result[ptr++] = hdiagonals[selected[0][i]]
  }
  for(var i=0; i<selected[1].length; ++i) {
    result[ptr++] = vdiagonals[selected[1][i]]
  }

  //Done
  return result
}

function splitSegment(segment) {
  //Make clones of vertices
  var a = segment.start
  var b = segment.end
  var aa = new Vertex(a.point, a.path, a.index, false)
  var bb = new Vertex(b.point, b.path, b.index, false)

  //Fix concavity
  a.concave = false
  b.concave = false

  //Split lists
  aa.prev = a.prev
  aa.next = bb
  bb.prev = aa
  bb.next = b.next
  aa.prev.next = aa
  bb.next.prev = bb
  a.prev = b
  b.next = a

  //Return new vertices
  return [aa, bb]
}

function findLoops(vertices) {
  //Initialize visit flag
  for(var i=0; i<vertices.length; ++i) {
    vertices[i].visited = false
  }
  //Walk over vertex list
  var loops = []
  for(var i=0; i<vertices.length; ++i) {
    var v = vertices[i]
    if(v.visited) {
      continue
    }
    //Walk along loop
    var loop = []
    while(!v.visited) {
      loop.push(v)
      v.visited = true
      v = v.next
    }
    loops.push(loop)
  }
  return loops
}


function splitConcave(vertices) {
  //First step: build segment tree from vertical segments
  var segments = []
  for(var i=0; i<vertices.length; ++i) {
    var v = vertices[i]
    if(v.next.point[1] === v.point[1]) {
      segments.push(new Segment(v, v.next, 1))
    }
  }
  var tree = createIntervalTree(segments)
  for(var i=0; i<vertices.length; ++i) {
    var v = vertices[i]
    if(!v.concave) {
      continue
    }

    //Compute orientation
    var y = v.point[1]
    var direction
    if(v.prev.point[0] === v.point[0]) {
      console.log("here-prev", v.prev.point, v.point, v.next.point)
      direction = v.prev.point[1] < y
    } else {
      console.log("here-next", v.prev.point, v.point, v.next.point)
      direction = v.next.point[1] < y
    }
    direction = direction ? 1 : -1

    //Scan a horizontal ray
    var closestSegment = null
    var closestDistance = Infinity * direction
    tree.queryPoint(v.point[0], function(h) {
      var x = h.start.point[1]
      console.log(h[0], v.point[0], h[1], x, y, direction, closestDistance)
      if(direction > 0) {
        if(x > y && x < closestDistance) {
          closestDistance = x
          closestSegment = h
        }
      } else {
        if(x < y && x > closestDistance) {
          closestDistance = x
          closestSegment = h
        }
      }
    })

    console.log("casting ray: v=", v.point, closestSegment.start.point, closestSegment.end.point)

    //Create two splitting vertices
    var splitA = new Vertex([v.point[0], closestDistance], 0, 0, false)
    var splitB = new Vertex([v.point[0], closestDistance], 0, 0, false)

    console.log("split=", splitA.point)
    //Clear concavity flag
    v.concave = false

    //Split vertices
    splitA.prev = closestSegment.start
    closestSegment.start.next = splitA
    splitB.next = closestSegment.end
    closestSegment.end.prev = splitB

    //Update segment tree
    tree.remove(closestSegment)
    tree.insert(new Segment(closestSegment.start, splitA, 1))
    tree.insert(new Segment(splitB, closestSegment.end, 1))

    //Append vertices
    vertices.push(splitA, splitB)

    //Cut v, 4 different cases
    if(direction < 0) {
      if(v.prev.point[0] === v.point[0]) {
        // Case 1
        // --->*  
        //     |
        //     |
        //     V
        splitA.next = v
        splitB.prev = v.prev
      } else {
        // Case 2
        //     |
        //     |
        //     V
        // <---*
        splitA.next = v.next
        splitB.prev = v
      }
    } else {
      if(v.prev.point[0] === v.point[0]) {
        // Case 3
        // *<---
        // |
        // |
        // V
        splitA.next = v
        splitB.prev = v.prev
      } else {
        // Case 4
        // |
        // |
        // V
        // *--->
        splitA.next = v.next
        splitB.prev = v
      }
    }
    //Fix up links
    splitA.next.prev = splitA
    splitB.prev.next = splitB
  }

  //Cut polygons into rectangles
  var loops = findLoops(vertices)
  var result = new Array(loops.length)
  for(var i=0; i<loops.length; ++i) {
    var L = loops[i]
    var lo = [Infinity, Infinity]
    var hi = [-Infinity, -Infinity]
    result[i] = [lo, hi]
    for(var j=0; j<L.length; ++j) {
      var v = L[j].point
      console.log(j, v)
      for(var k=0; k<2; ++k) {
        lo[k] = Math.min(lo[k], v[k])
        hi[k] = Math.max(hi[k], v[k])
      }
    }
  }
  return result
}

function decomposeRegion(paths) {
  //First step: unpack all vertices into internal format
  var numVertices = 0
  for(var i=0; i<paths.length; ++i) {
    numVertices += paths[i].length
  }
  var vertices = new Array(numVertices)
  var ptr = 0
  var npaths = new Array(paths.length)
  for(var i=0; i<paths.length; ++i) {
    var path = paths[i]
    var n = path.length
    var prev = path[n-2]
    var cur = path[n-1]
    npaths[i] = new Array(paths[i].length)
    for(var j=0; j<n; ++j) {
      var next = path[j]
      var concave = false
      if(prev[0] === cur[0]) {
        var dir0 = prev[1] < cur[1]
        var dir1 = cur[0] < next[0]
        concave = dir0 === dir1
      } else {
        var dir0 = prev[0] < cur[0]
        var dir1 = cur[1] < next[1]
        concave = dir0 !== dir1
      }
      npaths[i][j] = vertices[ptr++] = new Vertex(
        cur,
        i,
        (j + n - 1)%n,
        concave)
      prev = cur
      cur = next
    }
  }

  //Next build interval trees for segments, link vertices into a list
  var hsegments = []
  var vsegments = []
  for(var i=0; i<npaths.length; ++i) {
    var p = npaths[i]
    for(var j=0; j<p.length; ++j) {
      var a = p[j]
      var b = p[(j+1)%p.length]
      if(a.point[0] === b.point[0]) {
        hsegments.push(new Segment(a,b,0))
      } else {
        vsegments.push(new Segment(a,b,1))
      }
      a.next = b
      b.prev = a
    }
  }
  var htree = createIntervalTree(hsegments)
  var vtree = createIntervalTree(vsegments)

  //Find horizontal and vertical diagonals
  var hdiagonals = getDiagonals(vertices, npaths, 0, vtree)
  var vdiagonals = getDiagonals(vertices, npaths, 1, htree)

  //Find all splitting edges
  var splitters = findSplitters(hdiagonals, vdiagonals)

  //Cut all the splitting diagonals
  for(var i=0; i<splitters.length; ++i) {
    var s = splitSegment(splitters[i])
    vertices.push(s[0], s[1])
  }

  //Cut out loops
  var loops = findLoops(vertices)
  var regions = []
  for(var i=0; i<loops.length; ++i) {
    regions.push.apply(regions, splitConcave(loops[i]))
  }

/*
  console.log("horiz:", util.inspect(hdiagonals, {depth:10}))
  console.log("vert:", util.inspect(vdiagonals, {depth:10}))
  console.log("splitters:", util.inspect(splitters, {depth:10}))
*/

  return regions  
}