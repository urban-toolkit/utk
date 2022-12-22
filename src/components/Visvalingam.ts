// Visvalingam polyline simplification algorithm, adapted from
// http://bost.ocks.org/mike/simplify/simplify.js

var stats: any = {};

export function simplifyVisvalingam(points: number[][], pointsToKeep: number) {

    var start = new Date().getTime(),
        heap = minHeap(),
        maxArea = 0,
        triangle: any,
        triangles = [];
    
    points = points.map(function (d: any) { return d.slice(0,2); });

    for (var i = 1, n = points.length - 1; i < n; ++i) {
        triangle = points.slice(i - 1, i + 2);
        if (triangle[1][2] = area(triangle)) {
            triangles.push(triangle);
            heap.push(triangle);
        }
    }

    for (var i = 0, n = triangles.length; i < n; ++i) {
        triangle = triangles[i];
        triangle.previous = triangles[i - 1];
        triangle.next = triangles[i + 1];
    }

    while (triangle = heap.pop()) {
        // If the area of the current point is less than that of the previous point
        // to be eliminated, use the latters area instead. This ensures that the
        // current point cannot be eliminated without eliminating previously-
        // eliminated points.
        if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
        else maxArea = triangle[1][2];

        if (triangle.previous) {
            triangle.previous.next = triangle.next;
            triangle.previous[2] = triangle[2];
            update(triangle.previous);
        } else {
            triangle[0][2] = triangle[1][2];
        }

        if (triangle.next) {
            triangle.next.previous = triangle.previous;
            triangle.next[0] = triangle[0];
            update(triangle.next);
        } else {
            triangle[2][2] = triangle[1][2];
        }
    }

    function update(triangle: any) {
        heap.remove(triangle);
        triangle[1][2] = area(triangle);
        heap.push(triangle);
    }

    var weights = points.map(function (d) { return d.length < 3 ? Infinity : d[2] += Math.random(); /* break ties */ });
    weights.sort(function (a, b) {
        return b - a;
    });

    var result = points.filter(function (d) {
        return d[2] > weights[pointsToKeep];
    });

    var end = new Date().getTime();
    stats[pointsToKeep] = end - start;
    return result;
};
    
function compare(a: any, b: any) {
    return a[1][2] - b[1][2];
}
  
function area(t: any) {
    return Math.abs((t[0][0] - t[2][0]) * (t[1][1] - t[0][1]) - (t[0][0] - t[1][0]) * (t[2][1] - t[0][1]));
}
  
function minHeap() {
    var heap: any = {},
        array: any = [];

    heap.push = function() {
    for (var i = 0, n = arguments.length; i < n; ++i) {
        var object = arguments[i];
        up(object.index = array.push(object) - 1);
    }
    return array.length;
    };

    heap.pop = function() {
    var removed = array[0],
        object = array.pop();
    if (array.length) {
        array[object.index = 0] = object;
        down(0);
    }
    return removed;
    };

    heap.size = function () {
    return array.length;
    };

    heap.remove = function(removed: any) {
    var i = removed.index,
        object = array.pop();
    if (i !== array.length) {
        array[object.index = i] = object;
        (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
    };

    function up(i: any) {
    var object = array[i];
    while (i > 0) {
        var up = ((i + 1) >> 1) - 1,
            parent = array[up];
        if (compare(object, parent) >= 0) break;
        array[parent.index = i] = parent;
        array[object.index = i = up] = object;
    }
    }

    function down(i: any) {
    var object = array[i];
    while (true) {
        var right = (i + 1) * 2,
            left = right - 1,
            down = i,
            child = array[down];
        if (left < array.length && compare(array[left], child) < 0) child = array[down = left];
        if (right < array.length && compare(array[right], child) < 0) child = array[down = right];
        if (down === i) break;
        array[child.index = i] = child;
        array[object.index = i = down] = object;
    }
    }

    return heap;
}