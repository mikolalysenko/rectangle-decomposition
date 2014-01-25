rectangle-decomposition
=======================
Computes an optimal rectilinear decomposition.  Based on the bipartite matching algorithm.  References:

* Jr. W. Lipski, E. Lodi, F. Luccio, C. Mugnai, L. Pagli. (1979) "On two-dimensional
data organization II". Fundamenta Informaticae
* E. Kawaguchi, T. Endo. (1980) "On a method of binary-picture representation and its
application to data compression" IEEE Transactions on Pattern Analysis and Machine Intelligence
* T. Ohtsuki. (1982) "Minimum dissection of rectilinear regions" IEEE Conference on Circuits and Systems
* T. Suk, C. Hoschl, J. Flusser. (2012) ["Rectangular Decomposition of Binary Images"](http://library.utia.cas.cz/separaty/2012/ZOI/suk-rectangular%20decomposition%20of%20binary%20images.pdf),Advanced Concepts for Intelligent Vision Systems. LNCS Vol. 7517

This code is 100% JavaScript and works in both node.js and in a browser via [browserify](https://github.com/substack/node-browserify).

## Example

```javascript
var decompose = require("rectangle-decomposition")

//First create a region:
//
//   *-----*
//   |     |
// *-*     |
// |       |
// | *-*   |
// | | |   |
// | *-*   |
// |       |
// *-------*
//
//Regions are defined by lists of loops, default oriented counter clockwise
//
var region = [  
  [[1,1], [1,2], [2,2], [2,1]],
  [[0,0], [4,0], [4,4], [1,4], [1,3], [0,3]]]

//Next, extract rectangles
//
var rectangles = decompose(region)

console.log(rectangles)

//Prints out:
//
//  [ [ [ 1, 0 ], [ 2, 1 ] ],
//    [ [ 0, 0 ], [ 1, 3 ] ],
//    [ [ 2, 0 ], [ 4, 4 ] ],
//    [ [ 1, 2 ], [ 2, 4 ] ] ]
//

//Equivalent to the following decomposition:
//
//   *-----*
//   | !   |
// *-* !   |
// | ! !   |
// | *-*   |
// | | |   |
// | *-*   |
// | ! !   |
// *-------*
//
```

## Install

```
npm install rectangle-decomposition
```

## API

### `require("rectangle-decomposition")(loops[,clockwise])`
Decomposes the polygon defined by the list of loops into a collection of rectangles.

* `loops` is an array of loops vertices representing the boundary of the region.  Each loop must be a simple rectilinear polygon (ie no self intersections), and the line segments of any two loops must only meet at vertices.  The collection of loops must also be bounded.
* `clockwise` is a boolean flag which if set flips the orientation of the loops.  Default is `true`, ie all loops follow the right-hand rule (counter clockwise orientation)

**Returns** A list of rectangles that decompose the region bounded by loops into the smallest number of non-overlapping rectangles.

## Credits
(c) 2014 Mikola Lysenko. MIT License