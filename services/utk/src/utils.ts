/**
 * Multiply matrices of any dimensions given compatible columns and rows.
 */
export function multiplyMatrices(A: number[][], B: number[][]) {
    var result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));

    return result.map((row, i) => {
        return row.map((val, j) => {
            return A[i].reduce((sum, elm, k) => sum + (elm*B[k][j]) ,0)
        })
    })
}

export function rotateYMatrix(a: number) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [[cos(a), 0, sin(a), 0], [0, 1, 0, 0], [-sin(a), 0, cos(a), 0], [0, 0, 0, 1]];

}

export function rotateZMatrix(a: number) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [[cos(a), -sin(a), 0, 0], [sin(a), cos(a), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

}

export function translateMatrix(x: number, y: number, z: number) {
    return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
}

export function dot(v1: number[], v2: number[]) {
    if(v1.length != v2.length){
        throw new Error("v1 and v2 have different number of dimensions");
    }

    let result = 0;

    for(let i = 0; i < v1.length; i++){
        result += v1[i]*v2[i];
    }

    return result;
}

export function angle(v1: number[], v2: number[]) {

    if(v1.length != v2.length){
        throw new Error("v1 and v2 have different number of dimensions");
    }

    let zero = true;

    for(let i = 0; i < v1.length; i++){
        if(v1[i] != 0){
            zero = false;
            break;
        }
    }

    if(zero)
        return 0;

    zero = true;

    for(let i = 0; i < v2.length; i++){
        if(v2[i] != 0){
            zero = false;
            break;
        }
    }

    if(zero)
        return 0;

    let unit_1 = normalize(v1);
    let unit_2 = normalize(v2);

    let dot_product = dot(unit_1, unit_2);

    let angle_vectors = Math.acos(dot_product) * 180.0 / Math.PI;

    return angle_vectors;
}

export function radians(angle: number){
    return angle * Math.PI / 180;
}

export function degree(radians: number){
    return radians * 180 / Math.PI;
}

// From glMatrix
export function cross(a: any[], b: any[]) {
    var out = [0,0,0];
    let ax = a[0],
    ay = a[1],
    az = a[2];

  let bx = b[0],
    by = b[1],
    bz = b[2];

  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;

  return out;
}

// From glMatrix
export function normalize(a: number[]) {

    let out = [];

    let len = 0;

    for(let i = 0; i < a.length; i++){
        len += a[i]*a[i];
    }

    if(len > 0){
        len = 1 / Math.sqrt(len);
    }

    for(let i = 0; i < a.length; i++){
        out.push(a[i] * len);
    }

    return out;

}

export function add(a: any[], b: any[]) {
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
}

export function sub(a: number[], b: number[]) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
}

export function euclideanDistance(p1: number[], p2: number[]){
    if(p1.length != p2.length){
        throw new Error("p1 and p2 have different number of dimensions");
    }

    let result = 0;

    for(let i = 0; i < p1.length; i++){
        result += Math.pow(p1[i] - p2[i], 2)
    }

    return Math.sqrt(result);
}