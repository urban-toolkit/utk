
export function createShader(gl: any, type: any, source: string) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var info = gl.getShaderInfoLog(shader);
        console.log('Could not compile WebGL program:' + info);
    }

    return shader;
}

export function createProgram(gl: any, vertexShader: any, fragmentShader: any) {
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var info = gl.getProgramInfoLog(program);
        console.log('Could not compile WebGL program:' + info);
    }

    return program;
}

// export function createTexture2D(gl, width, height, internalFormat, border, format, type, data, minFilter, magFilter, wrapS, wrapT) {
//     var texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, border, format, type, data);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
//     gl.bindTexture(gl.TEXTURE_2D, null);
    
//     return texture;
// }

// export function createFBO(gl, attachmentPoint, texture) {
//     var fbo = gl.createFramebuffer();
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//     gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, 0); 


//     if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
//         console.log("Problem creating FBO.");
//     }
//     gl.bindFramebuffer(gl.FRAMEBUFFER, null);

//     return fbo;
// }

// export function isAbv(value: any) {
//     return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
// }

// export function createBuffer(gl: any, type: any, data: string | any[]) {

//     if(data.length === 0)
//         return null;

//     if(!isAbv(data)) {
//         console.warn('Data is not an instance of ArrayBuffer');
//         return null;
//     }

//     var buffer = gl.createBuffer();
//     gl.bindBuffer(type, buffer);
//     gl.bufferData(type, data, gl.STATIC_DRAW);

//     return buffer;
// }

// lab 3
export function createBuffers(gl: any, triangles: any) {

    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles['positions']), gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles['colors']), gl.STATIC_DRAW);

    var elemBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles['elements']), gl.STATIC_DRAW);

    return { 'positions': posBuffer, 'colors': colorBuffer, 'elements': elemBuffer };
}

// export function createVAO(gl:any, posAttribLoc: any, posBuffer: WebGLBuffer, normAttribLoc = null, normBuffer = null, colorAttribLoc = null, colorBuffer = null) {

//     var vao = gl.createVertexArray();

//     gl.bindVertexArray(vao);

//     if(posAttribLoc != null && posAttribLoc !== undefined) {
//         gl.enableVertexAttribArray(posAttribLoc);
//         var size = 3;
//         var type = gl.FLOAT;
//         gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
//         gl.vertexAttribPointer(posAttribLoc, size, type, false, 0, 0);
//     }

//     if(normAttribLoc != null && normAttribLoc !== undefined) {
//         gl.enableVertexAttribArray(normAttribLoc);
//         size = 3;
//         type = gl.FLOAT;
//         gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
//         gl.vertexAttribPointer(normAttribLoc, size, type, false, 0, 0);
//     }

//     if(colorAttribLoc != null && colorAttribLoc !== undefined) {
//         gl.enableVertexAttribArray(colorAttribLoc);
//         size = 4;
//         type = gl.FLOAT;
//         gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
//         gl.vertexAttribPointer(colorAttribLoc, size, type, false, 0, 0);
//     }

//     return vao;
// }

// lab 3
export function createVAO(gl: any, posAttribLoc: any, colorAttribLoc:any, buffers:any) {

    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(posAttribLoc);
    var size = 3; // number of components per attribute
    var type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers['positions']);
    gl.vertexAttribPointer(posAttribLoc, size, type, false, 0, 0);

    gl.enableVertexAttribArray(colorAttribLoc);
    size = 4;
    type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers['colors']);
    gl.vertexAttribPointer(colorAttribLoc, size, type, false, 0, 0);

    return vao;
}

/*
    Code adapted from  https://github.com/gregtatum/mdn-model-view-projection
*/
export function multiplyMatrices(a: any[], b: any[]) {

    // TODO - Simplify for explanation
    // currently taken from https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js#L306-L337

    var result = [];

    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    result[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    result[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    result[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    result[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return result;
}

export function invertMatrix(matrix: any[]) {

    // Adapted from: https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js

    // Performance note: Try not to allocate memory during a loop. This is done here
    // for the ease of understanding the code samples.
    var result = [];

    var n11 = matrix[0], n12 = matrix[4], n13 = matrix[8], n14 = matrix[12];
    var n21 = matrix[1], n22 = matrix[5], n23 = matrix[9], n24 = matrix[13];
    var n31 = matrix[2], n32 = matrix[6], n33 = matrix[10], n34 = matrix[14];
    var n41 = matrix[3], n42 = matrix[7], n43 = matrix[11], n44 = matrix[15];

    result[0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    result[4] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    result[8] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    result[12] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
    result[1] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
    result[5] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
    result[9] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
    result[13] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
    result[2] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
    result[6] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
    result[10] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
    result[14] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
    result[3] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
    result[7] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
    result[11] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
    result[15] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

    var determinant = n11 * result[0] + n21 * result[4] + n31 * result[8] + n41 * result[12];

    if (determinant === 0) {
        throw new Error("Can't invert matrix, determinant is 0");
    }

    for (var i = 0; i < result.length; i++) {
        result[i] /= determinant;
    }

    return result;
}

export function multiplyArrayOfMatrices(matrices: string | any[]) {

    var inputMatrix = matrices[0];

    for (var i = 1; i < matrices.length; i++) {
        inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
    }

    return inputMatrix;
}

export function rotateMatrix(a: number, b: any, c: any) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [
        cos(a), -sin(a), 0, 0,
        sin(a), cos(a), -sin(a), 0,
        0, sin(a), cos(a), 0,
        0, 0, 0, 1
    ];

}

export function rotateXMatrix(a: number) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [
        1, 0, 0, 0,
        0, cos(a), -sin(a), 0,
        0, sin(a), cos(a), 0,
        0, 0, 0, 1
    ];
}

export function rotateYMatrix(a: number) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [
        cos(a), 0, sin(a), 0,
        0, 1, 0, 0,
        -sin(a), 0, cos(a), 0,
        0, 0, 0, 1
    ];
}

export function rotateZMatrix(a: number) {

    var cos = Math.cos;
    var sin = Math.sin;

    return [
        cos(a), -sin(a), 0, 0,
        sin(a), cos(a), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

export function translateMatrix(x: number, y: number, z: number) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ];
}

export function scaleMatrix(w: number, h: number, d: number) {
    return [
        w, 0, 0, 0,
        0, h, 0, 0,
        0, 0, d, 0,
        0, 0, 0, 1
    ];
}

export function perspectiveMatrix(fieldOfViewInRadians: number, aspectRatio: number, near: number, far: number) {
    var f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
    var rangeInv = 1 / (near - far);

    return [
        f / aspectRatio, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
}

export function orthographicMatrix(left: number, right: number, bottom: number, top: number, near: number, far: number) {

    // Each of the parameters represents the plane of the bounding box

    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);

    var row4col1 = (left + right) * lr;
    var row4col2 = (top + bottom) * bt;
    var row4col3 = (far + near) * nf;

    return [
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        row4col1, row4col2, row4col3, 1
    ];
}


export function identityMatrix() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

// From glMatrix
const EPSILON = 0.000001;
export function lookAt(eye: any[], center: any[], up: any[]) {

    var out = identityMatrix();
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    let eyex = eye[0];
    let eyey = eye[1];
    let eyez = eye[2];
    let upx = up[0];
    let upy = up[1];
    let upz = up[2];
    let centerx = center[0];
    let centery = center[1];
    let centerz = center[2];
  
    if (
      Math.abs(eyex - centerx) < EPSILON &&
      Math.abs(eyey - centery) < EPSILON &&
      Math.abs(eyez - centerz) < EPSILON
  
    ) {
      return identityMatrix();
    }
  
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);
  
    if (!len) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
  
    } else {
      len = 1 / len;
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }
  
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.hypot(y0, y1, y2);
  
    if (!len) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len;
      y1 *= len;
      y2 *= len;
    }
  
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
  
    return out;

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
    var out = [0,0,0];
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;
  
    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
    }
  
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
}

export function add(a: any[], b: any[]) {
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
}

export function sub(a: number[], b: number[]) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
}



export function createCube() {

    var positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];

    var colorsOfFaces = [
        [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
        [1.0, 0.3, 0.3, 1.0],    // Back face: red
        [0.3, 1.0, 0.3, 1.0],    // Top face: green
        [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
        [1.0, 0.3, 1.0, 1.0]     // Left face: purple
    ];

    var colors: any[] = [];
    for (var j = 0; j < 6; j++) {
        var polygonColor = colorsOfFaces[j];

        for (var i = 0; i < 4; i++) {
            colors = colors.concat(polygonColor);
        }
    }

    var elements = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23    // left
    ];

    return {
        'positions': positions,
        'colors': colors,
        'elements': elements
    };

}