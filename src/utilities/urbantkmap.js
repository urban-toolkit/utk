class Environment {
    /**
     * Set environment parameters
     * @param {{backend: string, dataFolder: string}} env Environment parameters
     */
    static setEnvironment(env) {
        Environment.backend = env.backend;
        Environment.dataFolder = env.dataFolder;
    }
}
// App environment parameters
Environment.backend = 'localhost';
Environment.dataFolder = '../data';

class GeoUtils {
    /**
     * Converts from lat, lng to world coordinates
     * @param {number} latitude the latitude of the point
     * @param {number} longitude the longitude of the point
     */
    static latLng2Coord_old(latitude, longitude) {
        const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
        const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;
        const sinLatitude = Math.sin(latitude * pi_180);
        const pixelY = 256.0 - ((0.5 - Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude)) / (pi_4)) * 256.0);
        const pixelX = ((longitude + 180.0) / 360.0) * 256.0;
        return [pixelX, pixelY];
    }
    static latLng2Coord(latitude, longitude) {
        let y = 0;
        if (latitude == 90.0) {
            y = GeoUtils.res;
        }
        else if (latitude == -90.0) {
            y = 0.0;
        }
        else {
            y = (Math.PI - Math.atanh(Math.sin(latitude * Math.PI / 180))) / Math.PI * GeoUtils.res / 2.0;
        }
        return [
            y * Math.pow(2, GeoUtils.wLevel),
            -(longitude + 180.0) / 360.0 * GeoUtils.res * Math.pow(2, GeoUtils.wLevel),
        ];
    }
    /**
     * Converts from world coordinates to lat, lng
     * @param {number} x the x coordinate of the point
     * @param {number} y the y coordinate of the point
     */
    static coord2LatLng_old(x, y) {
        const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
        const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;
        const longitude = ((x / GeoUtils.res) * 360.0) - 180.0;
        let latitude = (256.0 - y) / GeoUtils.res;
        latitude = Math.exp((0.5 - latitude) * pi_4);
        latitude = (latitude - 1.0) / (1.0 + latitude);
        latitude = Math.asin(latitude) / pi_180;
        return [latitude, longitude];
    }
    static coord2LatLng(x, y) {
        return [
            Math.atan(Math.sinh(Math.PI * (1 - y / GeoUtils.wLevel / 128))) * 180 / Math.PI,
            x * 360 / GeoUtils.wLevel / GeoUtils.res - 180
        ];
    }
    /**
     * Computes the ground resolution
     * @param {number} lat the latitude value
     * @param {number} lng the longitude value
     * @param {number} zoom the zoom leevl
     */
    static groundResolution(lat, lng, zoom) {
        return Math.cos(lat * Math.PI / 180) * 6378137 * 2 * Math.PI / Math.pow(2, zoom);
    }
}
GeoUtils.res = 256.0;
GeoUtils.wLevel = 22;

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$2() {
  var out = new ARRAY_TYPE(16);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity(out);
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
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply;

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$1() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues$1(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

/**
 * 3D Camera representation
 */
class Camera {
    /**
     * The Camera constructor
     */
    constructor(wx, wy) {
        // View parameters
        this.wOrigin = create();
        this.wEye = create$1();
        this.wEyeDir = create$1();
        this.wLookAt = create$1();
        this.wUp = create$1();
        this.fovy = 45 * Math.PI / 180.0;
        // Transformation matrices
        this.mProjectionMatrix = create$2();
        this.mViewMatrix = create$2();
        this.mModelMatrix = create$2();
        this.groundRes = GeoUtils.groundResolution(wx, wy, 10);
        // console.log('--->', wx, wy, this.groundRes)
        // z-values start from here are in meters
        this.wNear = 0.01;
        this.wFar = 1e9 / this.groundRes;
        const projectedCenter = [0, 0];
        this.wOrigin = fromValues(wx, wy);
        this.wLookAt = fromValues$1(projectedCenter[0], projectedCenter[1], 0);
        this.wEye = fromValues$1(projectedCenter[0], projectedCenter[1], this.groundRes / 10);
        this.zScaling(1 / this.groundRes);
        // meter is not longer used in the remaining code
        this.wUp = fromValues$1(0, 1, 0);
    }
    getProjectionMatrix() {
        return this.mProjectionMatrix;
    }
    getViewMatrix() {
        return this.mViewMatrix;
    }
    getModelViewMatrix() {
        const modelViewMatrix = mul(create$2(), this.mViewMatrix, this.mModelMatrix);
        return modelViewMatrix;
    }
    getWorldOrigin() {
        return this.wOrigin;
    }
    getEye() {
        return this.wEye;
    }
    getGroundResolution() {
        return this.groundRes;
    }
    setViewportResolution(x, y) {
        this.viewportWidth = x;
        this.viewportHeight = y;
    }
    getViewportResolution() {
        return [
            this.viewportWidth,
            this.viewportHeight
        ];
    }
    updateEyeDirAndLen() {
        sub(this.wEyeDir, this.wLookAt, this.wEye);
        this.wEyeLength = length(this.wEyeDir);
        normalize(this.wEyeDir, this.wEyeDir);
    }
    zScaling(scale) {
        this.wEye[2] = this.wEye[2] * scale;
        this.wLookAt[2] = this.wLookAt[2] * scale;
        this.updateEyeDirAndLen();
    }
    zoom(delta, x, y) {
        delta = delta < 0 ? 0.003 : -0.003;
        const dir = this.screenCoordToWorldDir(x, y);
        // this.wEye += dir * delta;
        scaleAndAdd(this.wEye, this.wEye, dir, delta);
        // this.wLookAt = this.wEye + this.wEyeDir * this.wEyeLength;
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    translate(dx, dy) {
        const scale$1 = this.wEye[2];
        const X = create$1();
        normalize(X, cross(X, this.wEyeDir, this.wUp));
        // D = X * dx * scale + this.wUp * dy * scale;
        const D = add(create$1(), scale(create$1(), X, dx * scale$1), scale(create$1(), this.wUp, dy * scale$1));
        add(this.wEye, this.wEye, D);
        // this.wLookAt = this.wEye + this.wEyeDir * this.wEyeLength;
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    yaw(delta) {
        rotateZ(this.wEyeDir, this.wEyeDir, fromValues$1(0, 0, 0), delta);
        rotateZ(this.wUp, this.wUp, fromValues$1(0, 0, 0), delta);
        // this.wLookAt = this.wEye + this.wEyeDir * this.wEyeLength;
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    pitch(delta) {
        delta = -delta;
        // this.wEyeDir = this.wUp * sin(delta) + this.wEyeDir * cos(delta);
        add(this.wEyeDir, scale(create$1(), this.wUp, Math.sin(delta)), scale(create$1(), this.wEyeDir, Math.cos(delta)));
        normalize(this.wEyeDir, this.wEyeDir);
        // this.wLookAt = this.wEye + this.wEyeDir * this.wEyeLength;
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
        cross(this.wUp, cross(create$1(), this.wEyeDir, this.wUp), this.wEyeDir);
        normalize(this.wUp, this.wUp);
    }
    update() {
        // model matrix
        this.mModelMatrix = fromScaling(create$2(), fromValues$1(1, 1, 1 / this.groundRes));
        // view matrix
        lookAt(this.mViewMatrix, this.wEye, this.wLookAt, this.wUp);
        // TODO: get the aspect ratio from canvas?
        perspective(this.mProjectionMatrix, this.fovy, 1, this.wNear, this.wFar);
    }
    screenCoordToWorldDir(x, y) {
        const wRight = create$1();
        normalize(wRight, cross(wRight, this.wEyeDir, this.wUp));
        const upOffset = scale(create$1(), this.wUp, Math.tan(this.fovy / 2) * (y - 0.5) * 2);
        const rightOffset = scale(create$1(), wRight, Math.tan(this.fovy / 2) * (x - 0.5) * 2);
        const offset = add(create$1(), upOffset, rightOffset);
        const dir = add(create$1(), this.wEyeDir, offset);
        normalize(dir, dir);
        return dir;
    }
    screenCoordToLatLng(x, y) {
        const dir = this.screenCoordToWorldDir(x, y);
        const t = -this.wEye[2] / dir[2];
        if (t > 0) {
            const intersectPoint = scaleAndAdd(create$1(), this.wEye, dir, t);
            const originCoord = GeoUtils.latLng2Coord(this.wOrigin[0], this.wOrigin[1]);
            const latLng = GeoUtils.coord2LatLng(intersectPoint[0] + originCoord[0], intersectPoint[1] + originCoord[1]);
            //console.log(latLng);
            return latLng;
        }
        return null;
    }
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
    reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
    reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
    reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
    reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
    reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy: function(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable: function() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return "#" + hex(this.r) + hex(this.g) + hex(this.b);
}

function rgb_formatRgb() {
  var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
  return (a === 1 ? "rgb(" : "rgba(")
      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
      + (a === 1 ? ")" : ", " + a + ")");
}

function hex(value) {
  value = Math.max(0, Math.min(255, Math.round(value) || 0));
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "hsl(" : "hsla(")
        + (this.h || 0) + ", "
        + (this.s || 0) * 100 + "%, "
        + (this.l || 0) * 100 + "%"
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

function basis$1(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color;
    for (i = 0; i < n; ++i) {
      color = rgb(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function(t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$1);

var ramp = scheme => rgbBasis(scheme[scheme.length - 1]);

var scheme$1 = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(colors);

var Blues = ramp(scheme$1);

var scheme = new Array(3).concat(
  "fee0d2fc9272de2d26",
  "fee5d9fcae91fb6a4acb181d",
  "fee5d9fcae91fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
).map(colors);

var Reds = ramp(scheme);

/**
 * Layer types definition
 */
class LayerTypes {
}
LayerTypes.TRIANGLE_2D_LAYER = 'triangle';
LayerTypes.TRIANGLE_3D_LAYER = 'triangle3D';
LayerTypes.LINE_LAYER = 'line';
LayerTypes.POINT_LAYER = 'point';
/**
 * Colormap types definition
 */
class ColorMapTypes {
}
ColorMapTypes.SEQUENTIAL_RED_MAP = 'sequential_red';
ColorMapTypes.SEQUENTIAL_BLUE_MAP = 'sequential_blue';
ColorMapTypes.DIVERGING_BLUE_RED_MAP = 'diverging_blue_red';
ColorMapTypes.DIVERGING_GREEN_BROWN_MAP = 'diverging_green_brown';
ColorMapTypes.QUALITATIVE_MAP = 'qualitative';
/**
 * Mapview interaction status
 */
class MapViewStatus {
}
MapViewStatus.IDLE = 0;
MapViewStatus.DRAG = 1;

class ColorMap {
    static getColor(value, color, reverse = false) {
        if (reverse) {
            value = 1 - value;
        }
        switch (color) {
            case ColorMapTypes.SEQUENTIAL_RED_MAP:
                ColorMap.interpolator = Reds;
                break;
            case ColorMapTypes.SEQUENTIAL_BLUE_MAP:
                ColorMap.interpolator = Blues;
                break;
            default:
                ColorMap.interpolator = Reds;
                break;
        }
        const numberPattern = /\d+/g;
        const rgbStr = ColorMap.interpolator(value).match(numberPattern);
        if (rgbStr === null) {
            return [0, 0, 0];
        }
        return rgbStr.map(el => +el / 255);
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class DataLoader {
    /**
     * Loads a json file
     * @param {string} url json file url
     * @returns {Promise<unknown>} The load json promise
     */
    static getJsonData(url) {
        return __awaiter(this, void 0, void 0, function* () {
            // Return a new promise.
            const response = yield fetch(url);
            const json = yield response.json();
            return json;
        });
    }
    /**
     * Loads a text file
     * @param {string} url text file url
     * @returns {Promise<string>} The load text promise
     */
    static getTextData(url) {
        return __awaiter(this, void 0, void 0, function* () {
            // Return a new promise.
            const response = yield fetch(url);
            const txt = yield response.text();
            return txt;
        });
    }
}

class DataApi {
    /**
     * Load all layers
     * @param {string} index The layers index file
     */
    static getMapData(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${Environment.backend}/${Environment.dataFolder}/${index}`;
            console.log(url);
            const datasets = yield DataLoader.getJsonData(url);
            return datasets;
        });
    }
    /**
     * Load the camera
     * @param {string} camera The camera file
     */
    static getCameraParameters(camera) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${Environment.backend}/${Environment.dataFolder}/${camera}.json`;
            console.log(url);
            const params = yield DataLoader.getJsonData(url);
            return params;
        });
    }
    /**
     * Gets the layer data
     * @param {string} layerId the layer data
     */
    static getLayer(layerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
            console.log(url);
            const feature = yield DataLoader.getJsonData(url);
            return feature;
        });
    }
    /**
     * Gets the layer data
     * @param {string} layerId the layer data
     */
    static getLayerFeature(layerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
            console.log(url);
            const feature = yield DataLoader.getJsonData(url);
            return feature;
        });
    }
    /**
     * Gets the layer function
     * @param {string} layerId the layer data
     */
    static getLayerFunction(layerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
            const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
            console.log(url);
            const feature = yield DataLoader.getJsonData(url);
            return feature;
        });
    }
    /**
     * Gets the layer function
     * @param {string} layerId the layer data
     */
    static getLayerHighlight(layerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
            const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
            console.log(url);
            const feature = yield DataLoader.getJsonData(url);
            return feature;
        });
    }
}

class KeyEvents {
    /**
     * Key events constructor
     * @param {MapView} map the map to bind the events
     */
    constructor(map) {
        this._map = map;
    }
    bindEvents() {
        // sets the key listeners
        window.addEventListener('keydown', this.keyDown.bind(this), false);
    }
    /**
    * Handles key down event
    * @param {KeyboardEvent} event The fired event
    */
    keyDown(event) {
        // key value
        const key = +event.key;
        const layers = this._map.layerManager.layers;
        // number key
        if (!isNaN(key) && key < layers.length) {
            // makes in visible
            const isVisible = layers[key].visible;
            layers[key].visible = !isVisible;
            // render
            this._map.render();
        }
    }
}

/// <reference types="@types/webgl2" />
class Layer {
    /**
     * Layer constructor
     * @param {string} id The Mapview layer Identifier
     * @param {string} visible The initial visibility state
     * @param {string} selectable The initial selectability state
     */
    constructor(id, style, visible = true, selectable = false) {
        // layer's shader
        this._shaderProgram = [];
        this._layerId = id;
        this._style = style;
        this._visible = visible;
        this._selectable = selectable;
    }
    /**
     * Accessor for the layer id
     */
    get layerId() {
        return this._layerId;
    }
    /**
     * Accessor for the layer style
     */
    get style() {
        return this._style;
    }
    /**
     * Returns if the layers is visible
     */
    get visible() {
        return this._visible;
    }
    /**
     * Sets the visibility
     */
    set visible(visible) {
        this._visible = visible;
    }
    /**
     * Returns if the layers is selectable
     */
    get selectable() {
        return this._selectable;
    }
    /**
     * Sets the selection
     */
    set selectable(selectable) {
        this._selectable = selectable;
    }
    /**
     * Sends the camera to the layer
     */
    set camera(camera) {
        this._camera = camera;
    }
    /**
     * Inits the layer's shader program
     * @param {string} vsSource Vertex shader source
     * @param {string} fsSource Fragment shader source
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    initShaderProgram(vsSource, fsSource, glContext) {
        // load the shaders
        const vertexShader = this.buildShader(glContext.VERTEX_SHADER, vsSource, glContext);
        const fragmentShader = this.buildShader(glContext.FRAGMENT_SHADER, fsSource, glContext);
        // Create the shader program
        const shader = glContext.createProgram();
        // There was a problem loading the shaders
        if (!shader || !vertexShader || !fragmentShader) {
            return;
        }
        glContext.attachShader(shader, vertexShader);
        glContext.attachShader(shader, fragmentShader);
        glContext.linkProgram(shader);
        // If creating the shader program failed, alert
        if (!glContext.getProgramParameter(shader, glContext.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + glContext.getProgramInfoLog(shader));
        }
        // stores the shader
        this._shaderProgram.push(shader);
    }
    /**
     * Builds the layer shader
     * @param {number} type The shader type
     * @param {string} source The shader source string
     * @param {WebGL2RenderingContext} glContext The WebGL context
     * @returns {WebGLShader} The shader object
     */
    buildShader(type, source, glContext) {
        // creates the shader
        const shader = glContext.createShader(type);
        if (!shader) {
            return null;
        }
        // Send the source to the shader object
        glContext.shaderSource(shader, source);
        // Compile the shader program
        glContext.compileShader(shader);
        // See if it compiled successfully
        if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ');
            console.error(source);
            console.error(glContext.getShaderInfoLog(shader));
            glContext.deleteShader(shader);
            throw new Error('Unable to load the shader');
        }
        return shader;
    }
}

var surface$1 = "#f6f6f4";
var roads$1 = "#FFFFFF";
var parks$1 = "#eceeed";
var water$1 = "#cad2d4";
var sky$1 = "#FFFFFF";
var light = {
	surface: surface$1,
	roads: roads$1,
	parks: parks$1,
	water: water$1,
	sky: sky$1
};

var surface = "#343331";
var roads = "#454545";
var parks = "#323431";
var water = "#191b1a";
var sky = "#000000";
var dark = {
	surface: surface,
	roads: roads,
	parks: parks,
	water: water,
	sky: sky
};

// @ts-ignore 
class MapStyle {
    /**
     * Get the feature color
     * @param {string} type Feature type
     */
    static getColor(type) {
        // uses the default style if available
        const style = MapStyle.custom || MapStyle.default;
        const hex = style[type] || MapStyle.notFound;
        const str = hex.slice(1, 7);
        const rgb = [0, 2, 4].map((start) => {
            return parseInt(str.slice(start, start + 2), 16) / 255;
        });
        return rgb;
    }
    /**
     * Set the feature color
     * @param {any} style new map style in id: #rrggbb format
     */
    static setColor(name, style) {
        let styleObj = MapStyle.default;
        if (name === 'light') {
            styleObj = light;
        }
        else if (name === 'dark') {
            styleObj = dark;
        }
        else if (style) {
            styleObj = style;
        }
        MapStyle.custom = styleObj;
    }
    static getHighlightColor() {
        return [1.0, 0.8, 0];
    }
}
// default color map
MapStyle.default = {
    land: '#EEEEEE',
    roads: '#FFFFFF',
    parks: '#C3D0B2',
    water: '#B9CDD2',
    sky: '#BED2D7'
};
// default color for unknown layers
MapStyle.notFound = "#FFFFFF";

var vsShader$1 = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;const highp float res=256.0;const highp float wLevel=22.0;uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uWorldOrigin;in highp vec2 vertPos;in vec3 vertColor;out highp vec3 vColor;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){vec2 movedPos=latLngToPixel(vertPos.x,vertPos.y)-latLngToPixel(uWorldOrigin.x,uWorldOrigin.y);gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(movedPos,0.0,1.0);vColor=vertColor;}";

var fsShader$1 = "#version 300 es\nin highp vec3 vColor;out highp vec4 fragColor;void main(){fragColor=vec4(vColor,1.0);}";

/// <reference types="@types/webgl2" />
class LineLayer extends Layer {
    /**
     * The Line Layer constructor
     * @param {ILayerData} id the layer id
     */
    constructor(info) {
        super(info.id, info.style, info.visible !== undefined ? info.visible : true, info.selectable !== undefined ? info.selectable : false);
        // OpenGL data buffer
        this._glPositionBuffer = null;
        this._glColorBuffer = null;
        // data buffer
        this._positionBuffer = [];
        this._colorBuffer = [];
        // shader attribute id
        this._positionId = -1;
        this._colorId = -1;
        // transformation uniforms
        this._uModelViewMatrixId = null;
        this._uProjectionMatrixId = null;
        this._uWorldOriginId = null;
    }
    /**
     * Shader load signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    loadShaders(glContext) {
        return __awaiter(this, void 0, void 0, function* () {
            // load all shaders
            this.initShaderProgram(vsShader$1, fsShader$1, glContext);
            // vertex data on the shader
            this._positionId = glContext.getAttribLocation(this._shaderProgram[0], 'vertPos');
            this._colorId = glContext.getAttribLocation(this._shaderProgram[0], 'vertColor');
            // transformation uniforms on the shader
            this._uModelViewMatrixId = glContext.getUniformLocation(this._shaderProgram[0], 'uModelViewMatrix');
            this._uProjectionMatrixId = glContext.getUniformLocation(this._shaderProgram[0], 'uProjectionMatrix');
            this._uWorldOriginId = glContext.getUniformLocation(this._shaderProgram[0], 'uWorldOrigin');
            // load message
            console.log(`Shaders successfully loaded for layer ${this._layerId}.`);
        });
    }
    /**
     * Data update signature
     * @returns {Promise<any>} The load data promise
     */
    updateFeatures(glContext, data = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFeature(this._layerId) : data;
            // formats the buffer
            this._positionBuffer = [];
            // formats the buffer
            this._colorBuffer = [];
            // iterate over geometry
            for (const feature of feats) {
                // no geometry
                if (feature['geometry'] === undefined) {
                    continue;
                }
                // gets the feature color
                const rgb = MapStyle.getColor(this.style);
                // get the coordinates
                this._positionBuffer.push(...feature.geometry.coordinates);
                const posSize = feature.geometry.coordinates.length;
                // get the colors
                for (let id = 0; id < posSize / LineLayer.COORDS; id++) {
                    this._colorBuffer.push(...rgb);
                }
            }
            // creates the buffer
            this.createBuffers(glContext);
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Function update signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {IFeatureData[]} data layer function
     * @param {ColorMapTypes} cmap used color map
     */
    updateFunction(glContext, data, cmap = ColorMapTypes.SEQUENTIAL_RED_MAP) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFunction(this._layerId) : data;
            // new feature found
            this._colorBuffer = [];
            // fill the function array
            for (const feature of feats) {
                if (feature['scalar'] === undefined) {
                    continue;
                }
                // get the function values
                const scalar = feature.scalar;
                // min and max values
                const min = Math.min(...scalar);
                const max = Math.max(...scalar);
                // normalize colors
                scalar.map((val) => {
                    const nrm = (val - min) / (max - min);
                    const rgb = ColorMap.getColor(nrm, cmap);
                    this._colorBuffer.push(...rgb);
                });
            }
            // creates the scalar data vbo
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Style update implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    updateStyle(glContext) {
        // gets the new color
        const rgb = MapStyle.getColor(this.style);
        //
        const size = this._colorBuffer.length / 3;
        this._colorBuffer = [];
        for (let id = 0; id < size; id++) {
            this._colorBuffer.push(...rgb);
        }
        // creates the scalar data vbo
        this.createColorBuffer(glContext);
    }
    highlight(glContext, data) {
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext) {
        // invalid layers
        if (this._shaderProgram.length === 0 ||
            this._shaderProgram[0] === null ||
            this._glPositionBuffer === null ||
            this._glColorBuffer === null ||
            this._positionId < 0 ||
            this._colorId < 0) {
            return;
        }
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // sends the uniforms
        this.setUniforms(glContext);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        glContext.vertexAttribPointer(this._positionId, LineLayer.COORDS, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._positionId);
        // binds the scalar buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        glContext.vertexAttribPointer(this._colorId, 3, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorId);
        // binds the shader program
        glContext.useProgram(this._shaderProgram[0]);
        glContext.lineWidth(LineLayer.LINE_WIDTH);
        // draw the geometry
        glContext.drawArrays(glContext.LINES, 0, this._positionBuffer.length / LineLayer.COORDS);
        // disables the depth buffer
        glContext.disable(glContext.DEPTH_TEST);
    }
    /**
     * Layer picking function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {number} x Mouse x coordinate
     * @param {number} y Mouse y coordinate
     */
    pick(glContext, x, y) {
        // TODO.
    }
    /**
     * Send uniforms to the shader
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    setUniforms(glContext) {
        if (!this._shaderProgram.length || this._shaderProgram[0] === null) {
            return;
        }
        glContext.useProgram(this._shaderProgram[0]);
        // send matrices
        glContext.uniformMatrix4fv(this._uModelViewMatrixId, false, this._camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrixId, false, this._camera.getProjectionMatrix());
        // send world origin
        const worldOrigin = this._camera.getWorldOrigin();
        glContext.uniform2f(this._uWorldOriginId, worldOrigin[0], worldOrigin[1]);
    }
    /**
     * Layer VBO creation signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createBuffers(glContext) {
        // Create a buffer for the positions.
        this._glPositionBuffer = glContext.createBuffer();
        // Select the positionBuffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._positionBuffer), glContext.STATIC_DRAW);
    }
    /**
     * Scalar data vbo creation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createColorBuffer(glContext) {
        // Create a buffer for the colors.
        this._glColorBuffer = glContext.createBuffer();
        // Select the color buffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._colorBuffer), glContext.STATIC_DRAW);
    }
}
// number of coordinates per vertex
LineLayer.COORDS = 2;
// number of shaders
LineLayer.N_SHADER = 1;
// line width
LineLayer.LINE_WIDTH = 2;

var vsShader = "#version 300 es\nconst float PI=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uWorldOrigin;in vec2 vertPos;in float vertScalar;out highp float vScalar;vec2 latLngToPixel(float latitude,float longitude){float sinLatitude=sin(latitude*pi_180);float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){vec2 movedPos=latLngToPixel(vertPos.x,vertPos.y)-latLngToPixel(uWorldOrigin.x,uWorldOrigin.y);gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(movedPos,0.0,1.0);vScalar=vertScalar;gl_PointSize=8.0;}";

var fsShader = "#version 300 es\nin highp float vScalar;out highp vec4 fragColor;uniform sampler2D uColorMap;void main(){mediump float dist=length(gl_PointCoord.xy-vec2(.5,.5));dist=dist>0.5 ? 0.0 : 1.0;fragColor=vec4(texture(uColorMap,vec2(vScalar,0.5)).rgb,dist);}";

/// <reference types="@types/webgl2" />
class PointLayer extends Layer {
    /**
     * The Vector Layer constructor
     * @param {string} id the layer id
     */
    constructor(info) {
        super(info.id, info.style, info.visible !== undefined ? info.visible : true, info.selectable !== undefined ? info.selectable : false);
        // number of coordinates per vertex
        this._COORDS = 2;
        // OpenGL data buffer
        this._glPositionBuffer = null;
        this._glColorBuffer = null;
        // data buffer
        this._positionBuffer = [];
        this._colorBuffer = [];
        // shader attribute id
        this._positionId = -1;
        this._colorId = -1;
        // uniforms
        this._uModelViewMatrixId = null;
        this._uProjectionMatrixId = null;
        this._uWorldOriginId = null;
        this._uColorMapId = null;
    }
    /**
     * Shader load signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    loadShaders(glContext) {
        return __awaiter(this, void 0, void 0, function* () {
            // load all shaders
            this.initShaderProgram(vsShader, fsShader, glContext);
            // uniforms definition
            this._positionId = glContext.getAttribLocation(this._shaderProgram[0], 'vertPos');
            this._colorId = glContext.getAttribLocation(this._shaderProgram[0], 'vertScalar');
            this._uModelViewMatrixId = glContext.getUniformLocation(this._shaderProgram[0], 'uModelViewMatrix');
            this._uProjectionMatrixId = glContext.getUniformLocation(this._shaderProgram[0], 'uProjectionMatrix');
            this._uWorldOriginId = glContext.getUniformLocation(this._shaderProgram[0], 'uWorldOrigin');
            // colorMap texture
            this._uColorMapId = glContext.getUniformLocation(this._shaderProgram[0], 'uColorMap');
            // load message
            console.log(`Shaders successfully loaded for layer ${this._layerId}.`);
        });
    }
    /**
     * Data update signature
     * @returns {Promise<any>} The load data promise
     */
    updateFeatures(glContext, data = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFeature(this._layerId) : data;
            // formats the buffer
            this._positionBuffer = [];
            // formats the buffer
            this._colorBuffer = [];
            // iterates over the geometries
            for (const feature of feats) {
                // no geometry
                if (feature['geometry'] === undefined) {
                    continue;
                }
                // gets the feature color
                const rgb = MapStyle.getColor(this.style);
                // get the coordinates
                this._positionBuffer.push(...feature.geometry.coordinates);
                const posSize = feature.geometry.coordinates.length;
                // get the colors
                for (let id = 0; id < posSize / this._COORDS; id++) {
                    this._colorBuffer.push(...rgb);
                }
            }
            // creates the buffer
            this.createBuffers(glContext);
            this.createColorBuffer(glContext);
        });
    }
    updateFunction(glContext, data, cmap = ColorMapTypes.SEQUENTIAL_RED_MAP) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFunction(this._layerId) : data;
            // new feature found
            this._colorBuffer = [];
            // fill the function array
            for (const feature of feats) {
                if (feature['scalar'] === undefined) {
                    continue;
                }
                // get the function values
                const scalar = feature.scalar;
                // min and max values
                const min = Math.min(...scalar);
                const max = Math.max(...scalar);
                // normalize colors
                scalar.map((val) => {
                    const nrm = (val - min) / (max - min);
                    const rgb = ColorMap.getColor(nrm, cmap);
                    this._colorBuffer.push(...rgb);
                });
            }
            // creates the scalar data vbo
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Style update implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    updateStyle(glContext) {
        // gets the new color
        const rgb = MapStyle.getColor(this.style);
        //
        const size = this._colorBuffer.length / 3;
        this._colorBuffer = [];
        for (let id = 0; id < size; id++) {
            this._colorBuffer.push(...rgb);
        }
        // creates the scalar data vbo
        this.createColorBuffer(glContext);
    }
    highlight(glContext, data) {
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext) {
        // invalid layers
        if (this._shaderProgram.length === 0 ||
            this._shaderProgram[0] === null ||
            this._glPositionBuffer === null ||
            this._glColorBuffer === null ||
            this._positionId < 0 ||
            this._colorId < 0) {
            return;
        }
        // sends the uniforms
        this.setUniforms(glContext);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        glContext.vertexAttribPointer(this._positionId, this._COORDS, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._positionId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        glContext.vertexAttribPointer(this._colorId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorId);
        // binds the shader program
        glContext.useProgram(this._shaderProgram[0]);
        // draw the geometry
        glContext.drawArrays(glContext.POINTS, 0, this._positionBuffer.length / this._COORDS);
    }
    /**
     * Layer picking function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {number} x Mouse x coordinate
     * @param {number} y Mouse y coordinate
     */
    pick(glContext, x, y) {
        // TODO.
    }
    /**
     * Send uniforms to the shader
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    setUniforms(glContext) {
        if (!this._shaderProgram.length || this._shaderProgram[0] === null) {
            return;
        }
        glContext.useProgram(this._shaderProgram[0]);
        // send matrices
        glContext.uniformMatrix4fv(this._uModelViewMatrixId, false, this._camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrixId, false, this._camera.getProjectionMatrix());
        // send world origin
        const worldOrigin = this._camera.getWorldOrigin();
        glContext.uniform2f(this._uWorldOriginId, worldOrigin[0], worldOrigin[1]);
    }
    /**
     * Layer VBO creation signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createBuffers(glContext) {
        // Create a buffer for the positions.
        this._glPositionBuffer = glContext.createBuffer();
        // Select the positionBuffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._positionBuffer), glContext.STATIC_DRAW);
    }
    /**
     * Scalar data vbo creation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createColorBuffer(glContext) {
        // Create a buffer for the colors.
        this._glColorBuffer = glContext.createBuffer();
        // Select the color buffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._colorBuffer), glContext.STATIC_DRAW);
    }
}

var vsTriangle2D = "#version 300 es\nconst highp float pi=3.1415926535897932384626433832795;const highp float pi_180=0.017453292519943295769236907684886127134428718885417254560;const highp float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec2 vertPos;in highp vec3 vertRgb;out highp vec3 vRgb;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec2 movedPos=latLngToPixel(vertPos.x,vertPos.y)-latLngToPixel(uWorldOrigin.x,uWorldOrigin.y);highp vec4 viewPos=uModelViewMatrix*vec4(movedPos,0.0,1.0);vRgb=vertRgb;gl_Position=uProjectionMatrix*vec4(viewPos.xyz,1.0);}";

var fsTriangle2D = "#version 300 es\nin highp vec3 vRgb;out highp vec4 fragRgb;void main(){fragRgb=vec4(vRgb,1.0);}";

var vsTriangle3D = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertPos;in highp vec3 vertRgb;in highp vec3 vertNrm;out highp vec3 vNrm;out highp vec3 vRgb;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec2 movedLatLng=latLngToPixel(vertPos.x,vertPos.y)-latLngToPixel(uWorldOrigin.x,uWorldOrigin.y);highp vec3 movedPos=vec3(movedLatLng,vertPos.z);gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(movedPos,1.0);vNrm=normalize(vertNrm);vRgb=vertRgb;}";

var fsTriangle3D = "#version 300 es\nuniform highp mat4 uModelViewMatrix;in highp vec3 vNrm;in highp vec3 vRgb;out highp vec4 fragRgb;void main(){highp vec3 uLightDirection=normalize(vec3(0,-1,1));highp vec3 normal=normalize(vNrm);highp float light=max(dot(normal,uLightDirection)*0.6+0.3,0.0);if(length(normal)<10e-5){fragRgb=vec4(vec3(1.0,0.0,0.0)*light,1.0);}else{fragRgb=vec4(vRgb*light,1.0);}}";

var vsLine3D = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertPos;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec2 movedLatLng=latLngToPixel(vertPos.x,vertPos.y)-latLngToPixel(uWorldOrigin.x,uWorldOrigin.y);highp vec3 movedPos=vec3(movedLatLng,vertPos.z);gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(movedPos,1.0);}";

var fsLine3D = "#version 300 es\nout highp vec4 fragRgb;void main(){fragRgb=vec4(0.55,0.45,0.45,1.0);}";

/// <reference types="@types/webgl2" />
class TriangleLayer extends Layer {
    /**
     * The Triangle Layer constructor
     * @param {ILayerData} info the layer data
     */
    constructor(info) {
        super(info.id, info.style, info.visible !== undefined ? info.visible : true, info.selectable !== undefined ? info.selectable : false);
        // number of coordinates per vertex
        this._COORDS = 2;
        // layer type
        this._type = LayerTypes.TRIANGLE_2D_LAYER;
        this._renderStyle = 'smooth';
        this._renderNormal = false;
        // layer height
        this._height = 0;
        // OpenGL data buffer
        this._glPositionBuffer = null;
        this._glIndexBuffer = null;
        this._glIndexBufferWire = null;
        this._glColorBuffer = null;
        this._glNormalBuffer = null;
        this._glNormalRenderBuffer = null;
        // data buffer
        this._positionBuffer = [];
        this._indexBuffer = [];
        this._indexBufferWire = [];
        this._colorBuffer = [];
        this._normalBuffer = [];
        this._normalRenderBuffer = [];
        // shader attribute id
        this._positionId = -1;
        this._colorId = -1;
        this._normalId = -1;
        // uniforms
        this._uModelViewMatrixId = null;
        this._uProjectionMatrixId = null;
        this._uWorldOrigin = null;
        // stores the type
        this._type = info.type;
        // render style
        if (info.renderStyle) {
            this._renderStyle = info.renderStyle.split('+')[0];
            this._renderNormal = info.renderStyle.includes('normals');
            if (info.height) {
                this._height = info.height;
            }
        }
        // sets the layer dimension
        if (this._type === LayerTypes.TRIANGLE_3D_LAYER) {
            this._COORDS = 3;
        }
    }
    /**
     * Shader load implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    loadShaders(glContext) {
        return __awaiter(this, void 0, void 0, function* () {
            // loads the proprer shader
            if (this._type === LayerTypes.TRIANGLE_3D_LAYER) {
                this.initShaderProgram(vsTriangle3D, fsTriangle3D, glContext);
            }
            else {
                this.initShaderProgram(vsTriangle2D, fsTriangle2D, glContext);
            }
            // loads the line shader to render the normals
            if (this._renderNormal === true) {
                this.initShaderProgram(vsLine3D, fsLine3D, glContext);
            }
            // load message
            console.log(`Shaders successfully loaded for layer ${this._layerId}. Number of dimensions: ${this._COORDS}`);
        });
    }
    /**
     * Data update implementation
     * @returns {Promise<void>} The load data promise
     */
    updateFeatures(glContext, data = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFeature(this._layerId) : data;
            // loaded number of vertices
            let nverts = 0;
            // formats the buffer
            this._positionBuffer = [];
            // formats the buffer
            this._indexBuffer = [];
            this._indexBufferWire = [];
            // formats the buffer
            this._colorBuffer = [];
            // formats the buffer
            this._normalBuffer = [];
            // gets the feature color
            const rgb = MapStyle.getColor(this.style);
            // iterates over the geometries
            for (const feature of feats) {
                // no geometry
                if (feature['geometry'] === undefined) {
                    continue;
                }
                // get the coordinates
                feature.geometry.coordinates.forEach((v, i) => {
                    if (i % 3 < 2) {
                        this._positionBuffer.push(v);
                    }
                    else {
                        this._positionBuffer.push(v + this._height * 2);
                    }
                });
                const posSize = feature.geometry.coordinates.length;
                // get the colors
                for (let id = 0; id < posSize / this._COORDS; id++) {
                    this._colorBuffer.push(...rgb);
                }
                // build the indices
                const indices = feature.geometry.indices;
                if (indices) {
                    if (this._renderStyle === 'smooth') {
                        for (let id = 0; id < indices.length; id++) {
                            const globalId = indices[id] + nverts;
                            this._indexBuffer.push(globalId);
                        }
                    }
                    else if (this._renderStyle === 'wireframe') {
                        for (let id = 0; id < indices.length; id += 3) {
                            const glId_0 = indices[id] + nverts;
                            const glId_1 = indices[id + 1] + nverts;
                            const glId_2 = indices[id + 2] + nverts;
                            this._indexBufferWire.push(glId_0, glId_1, glId_1, glId_2, glId_2, glId_0);
                        }
                    }
                }
                // build the normal buffer
                const normals = feature.geometry.normals;
                if (this._type === LayerTypes.TRIANGLE_3D_LAYER && normals) {
                    for (let nId = 0; nId < normals.length / this._COORDS; nId++) {
                        const nx = normals[3 * nId + 0];
                        const ny = normals[3 * nId + 1];
                        const nz = normals[3 * nId + 2];
                        this._normalBuffer.push(nx, ny, nz);
                    }
                }
                // loaded vertices
                nverts += posSize / this._COORDS;
            }
            // build the normal geometry
            if (this._renderNormal) {
                const deltaX = 1 / 585.54; // zoom level = 10.
                const deltaZ = 10;
                this._normalRenderBuffer = [];
                for (let vId = 0; vId < this._positionBuffer.length / this._COORDS; vId++) {
                    const px = this._positionBuffer[3 * vId + 0];
                    const py = this._positionBuffer[3 * vId + 1];
                    const pz = this._positionBuffer[3 * vId + 2];
                    const nx = px + deltaX * this._normalBuffer[3 * vId + 0];
                    const ny = py + deltaX * this._normalBuffer[3 * vId + 1];
                    const nz = pz + deltaZ * this._normalBuffer[3 * vId + 2];
                    this._normalRenderBuffer.push(px, py, pz, nx, ny, nz);
                }
            }
            // creates the buffer
            this.createBuffers(glContext);
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Function update implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {IFeatureData[]} data layer function
     * @param {ColorMapTypes} cmap used color map
     */
    updateFunction(glContext, data, cmap = ColorMapTypes.SEQUENTIAL_RED_MAP) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the feature of index id
            const feats = data === undefined ? yield DataApi.getLayerFunction(this._layerId) : data;
            // new feature found
            this._colorBuffer = [];
            // fill the function array
            for (const feature of feats) {
                if (feature['scalar'] === undefined) {
                    continue;
                }
                // get the function values
                const scalar = feature.scalar;
                // min and max values
                const min = Math.min(...scalar);
                const max = Math.max(...scalar);
                // normalize colors
                scalar.map((val) => {
                    const nrm = (val - min) / (max - min);
                    const rgb = ColorMap.getColor(nrm, cmap);
                    this._colorBuffer.push(...rgb);
                });
            }
            // creates the scalar data vbo
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Style update implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    highlight(glContext, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            // new feature found
            if (this._colorBuffer.length === 0) {
                console.log("ERROR!!!!@");
                return;
            }
            // fill the function array
            for (const vid of ids) {
                // get the function values
                const rgb = MapStyle.getHighlightColor();
                this._colorBuffer[3 * vid + 0] = rgb[0];
                this._colorBuffer[3 * vid + 1] = rgb[1];
                this._colorBuffer[3 * vid + 2] = rgb[2];
                this._colorBuffer[3 * vid + 0] = rgb[0];
                this._colorBuffer[3 * vid + 1] = rgb[1];
                this._colorBuffer[3 * vid + 2] = rgb[2];
                this._colorBuffer[3 * vid + 0] = rgb[0];
                this._colorBuffer[3 * vid + 1] = rgb[1];
                this._colorBuffer[3 * vid + 2] = rgb[2];
            }
            // creates the scalar data vbo
            this.createColorBuffer(glContext);
        });
    }
    /**
     * Style update implementation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    updateStyle(glContext) {
        // gets the new color
        const rgb = MapStyle.getColor(this.style);
        //
        const size = this._colorBuffer.length / 3;
        this._colorBuffer = [];
        for (let id = 0; id < size; id++) {
            this._colorBuffer.push(...rgb);
        }
        // creates the scalar data vbo
        this.createColorBuffer(glContext);
    }
    computeNormal(p0, p1, p2) {
        const nrm = [0, 0, 0];
        const Ax = p0[0] - p1[0];
        const Ay = p0[1] - p1[1];
        const Az = p0[2] - p1[2];
        const Bx = p2[0] - p1[0];
        const By = p2[1] - p1[1];
        const Bz = p2[2] - p1[2];
        const Nx = Ay * Bz - Az * By;
        const Ny = Az * Bx - Ax * Bz;
        const Nz = Ax * By - Ay * Bx;
        let length = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz);
        length = length === 0 ? 1 : length;
        nrm[0] = Nx / length;
        nrm[1] = Ny / length;
        nrm[2] = Nz / length;
        return nrm;
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext) {
        // invalid layers
        if (!this._shaderProgram.length) {
            return;
        }
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.FRONT);
        this.renderMesh(glContext);
        this.renderNormals(glContext);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
    /**
     * Layer picking function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {number} x Mouse x coordinate
     * @param {number} y Mouse y coordinate
     */
    pick(glContext, x, y) {
        // TODO.
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    renderMesh(glContext) {
        // mesh shader
        this.setUniforms(glContext, 0);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        glContext.vertexAttribPointer(this._positionId, this._COORDS, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._positionId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormalBuffer);
        glContext.vertexAttribPointer(this._normalId, this._COORDS, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._normalId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        glContext.vertexAttribPointer(this._colorId, 3, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorId);
        // renders the layer using smooth lighting
        if (this._renderStyle === 'smooth') {
            glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndexBuffer);
            // draw the geometry
            glContext.drawElements(glContext.TRIANGLES, this._indexBuffer.length, glContext.UNSIGNED_INT, 0);
        }
        // renders the layer in wireframe 
        else if (this._renderStyle === 'wireframe') {
            glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndexBufferWire);
            // draw the geometry
            glContext.drawElements(glContext.LINES, this._indexBufferWire.length, glContext.UNSIGNED_INT, 0);
        }
    }
    /**
     * Send uniforms to the shader
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    renderNormals(glContext) {
        // normals shader
        this.setUniforms(glContext, 1);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormalRenderBuffer);
        glContext.vertexAttribPointer(this._positionId, this._COORDS, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._positionId);
        // draw the geometry
        glContext.drawArrays(glContext.LINES, 0, this._normalRenderBuffer.length);
    }
    /**
     * Send uniforms to the shader
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    setUniforms(glContext, shaderId) {
        if (this._shaderProgram.length <= shaderId) {
            return;
        }
        // choose the shader program
        glContext.useProgram(this._shaderProgram[shaderId]);
        // uniforms definition
        this._positionId = glContext.getAttribLocation(this._shaderProgram[shaderId], 'vertPos');
        this._colorId = glContext.getAttribLocation(this._shaderProgram[shaderId], 'vertRgb');
        this._normalId = glContext.getAttribLocation(this._shaderProgram[shaderId], 'vertNrm');
        this._uModelViewMatrixId = glContext.getUniformLocation(this._shaderProgram[shaderId], 'uModelViewMatrix');
        glContext.uniformMatrix4fv(this._uModelViewMatrixId, false, this._camera.getModelViewMatrix());
        this._uProjectionMatrixId = glContext.getUniformLocation(this._shaderProgram[shaderId], 'uProjectionMatrix');
        glContext.uniformMatrix4fv(this._uProjectionMatrixId, false, this._camera.getProjectionMatrix());
        const worldOrigin = this._camera.getWorldOrigin();
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram[shaderId], 'uWorldOrigin');
        glContext.uniform2f(this._uWorldOrigin, worldOrigin[0], worldOrigin[1]);
    }
    /**
     * Layer VBO creation signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createBuffers(glContext) {
        // Create a buffer for the positions.
        this._glPositionBuffer = glContext.createBuffer();
        // Select the positionBuffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glPositionBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._positionBuffer), glContext.STATIC_DRAW);
        // Create a buffer for the normals.
        this._glNormalBuffer = glContext.createBuffer();
        // Select the positionBuffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormalBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._normalBuffer), glContext.STATIC_DRAW);
        // Create a buffer for the positions.
        this._glNormalRenderBuffer = glContext.createBuffer();
        // Select the positionBuffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormalRenderBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._normalRenderBuffer), glContext.STATIC_DRAW);
        // Create a buffer for the indices.
        this._glIndexBuffer = glContext.createBuffer();
        // Select the index buffer as the one to apply buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndexBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indexBuffer), glContext.STATIC_DRAW);
        // Create a buffer for the indices.
        this._glIndexBufferWire = glContext.createBuffer();
        // Select the index buffer as the one to apply buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndexBufferWire);
        // send data to gpu
        glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indexBufferWire), glContext.STATIC_DRAW);
    }
    /**
     * Scalar data vbo creation
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    createColorBuffer(glContext) {
        // Create a buffer for the colors.
        this._glColorBuffer = glContext.createBuffer();
        // Select the color buffer as the one to apply buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorBuffer);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._colorBuffer), glContext.STATIC_DRAW);
    }
}

class LayerManager {
    constructor() {
        // Loaded layers
        this._layers = [];
    }
    /**
     * Layers vector accessor
     * @returns {Layer[]} The array of layers
     */
    get layers() {
        return this._layers;
    }
    /**
    * Creates a layer from the server
    * @param {string} layerType layer type
    * @param {string} layerId layer identifier
    * @returns {Layer | null} The load layer promise
    */
    createLayer(layerInfo) {
        // loaded layer
        let layer = null;
        // loads based on type
        switch (layerInfo.type) {
            case LayerTypes.TRIANGLE_2D_LAYER:
            case LayerTypes.TRIANGLE_3D_LAYER:
                layer = new TriangleLayer(layerInfo);
                break;
            case LayerTypes.LINE_LAYER:
                layer = new LineLayer(layerInfo);
                break;
            case LayerTypes.POINT_LAYER:
                layer = new PointLayer(layerInfo);
                break;
            default:
                console.error(`File ${layerInfo.id}.json has an unknown layer type: ${layerInfo.type}.`);
                break;
        }
        if (layer) {
            // adds the the list of layers
            this._layers.push(layer);
        }
        // returns the layer
        return layer;
    }
}

class MouseEvents {
    /**
     * Mouse events constructor
     * @param {MapView} map the map to bind the events
     */
    constructor(map) {
        // map reference
        this._map = map;
        // default values
        this._status = MapViewStatus.IDLE;
        this._lastPoint = [0, 0];
    }
    /**
     * Mouse events binding function
     */
    bindEvents() {
        // sets the canvas listeners
        this._map.canvas.addEventListener('wheel', this.mouseWheel.bind(this), false);
        this._map.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
        this._map.canvas.addEventListener('contextmenu', this.contextMenu.bind(this), false);
        this._map.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
        // sets the document listeners
        document.addEventListener('mouseup', this.mouseUp.bind(this), false);
    }
    /**
     * Handles mouse right click event
     * @param {MouseEvent} event The fired event
     */
    contextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    /**
     * Handles mouse down event
     * @param {MouseEvent} event The fired event
     */
    mouseDown(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        this._lastPoint = [event.offsetX, event.offsetY];
        if (event.ctrlKey) {
            const x = event.offsetX;
            const y = (this._map.canvas.height - event.offsetY);
            for (const layer of this._map.layerManager.layers) {
                if (!layer.selectable) {
                    continue;
                }
                layer.pick(this._map.glContext, x, y);
            }
        }
        else {
            this._status = MapViewStatus.DRAG;
        }
        this._map.render();
    }
    /**
     * Handles mouse move event
     * @param {MouseEvent} event The fired event
     */
    mouseMove(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        // changes the values
        if (this._status === MapViewStatus.DRAG) {
            const dx = (-event.offsetX + this._lastPoint[0]);
            const dy = event.offsetY - this._lastPoint[1];
            if (event.buttons === 1 && event.shiftKey) { // left button
                this._map.camera.yaw(dx / this._map.canvas.clientWidth);
                this._map.camera.pitch(dy / this._map.canvas.clientHeight);
            }
            else {
                this._map.camera.translate(dx / this._map.canvas.clientWidth, dy / this._map.canvas.clientHeight);
            }
            this._lastPoint = [event.offsetX, event.offsetY];
            this._map.render();
        }
    }
    /**
     * Handles mouse up event
     */
    mouseUp(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        // changes the values
        this._status = MapViewStatus.IDLE;
        this._map.render();
    }
    /**
     * Handles mouse down event
     * @param {WheelEvent} event The fired event
     */
    mouseWheel(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        // changes the values
        const maxAxisLength = Math.max(this._map.canvas.clientWidth, this._map.canvas.clientHeight);
        const x = event.offsetX / maxAxisLength;
        const y = (this._map.canvas.height - event.offsetY) / maxAxisLength;
        this._map.camera.zoom(event.deltaY * 0.01, x, y);
        this._map.render();
    }
}

/// <reference types="@types/webgl2" />
class MapView {
    /**
     * MapView constructor
     * @param {HTMLElement} mapDiv The html element to hold the map.
     */
    constructor(mapDiv) {
        // stores the map div
        this._mapDiv = mapDiv;
        // creates the new canvas element
        this._canvas = document.createElement('canvas');
        // gets the webgl context
        this._glContext = this._canvas.getContext('webgl2');
        // appends the canvas
        this._mapDiv.appendChild(this._canvas);
        // creates the manager
        this._layerManager = new LayerManager();
        // inits the mouse events
        this.initMouseEvents();
        // bind the window events
        this.initWindowEvents();
    }
    /**
     * gets the map div
     */
    get div() {
        return this._mapDiv;
    }
    /**
     * gets the canvas element
     */
    get canvas() {
        return this._canvas;
    }
    /**
     * gets the opengl context
     */
    get glContext() {
        return this._glContext;
    }
    /**
     * gets the camera object
     */
    get camera() {
        return this._camera;
    }
    /**
     * gets the layers
     */
    get layerManager() {
        return this._layerManager;
    }
    /**
     * Map initialization function
     * @param {IMapData | null} data Object containing the camera and layers. If data is null, then it tries to load data from disk.
     */
    initMapView(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data === null) {
                console.error('Map data not provided.');
                return;
            }
            // set the map style
            const style = ('style' in data ? data['style'] : 'default');
            MapStyle.setColor(style);
            // inits the camera
            yield this.initCamera(data.camera);
            // inits the layers
            yield this.initLayers(data.layers);
            // resizes the canvas
            this.resize();
        });
    }
    /**
     * Camera initialization function
     * @param {string | ICameraData} data Object containing the camera. If data is a string, then it loads data from disk.
     */
    initCamera(camera) {
        return __awaiter(this, void 0, void 0, function* () {
            // load the index file and its layers
            const params = typeof camera === 'string' ? yield DataApi.getCameraParameters(camera) : camera;
            // sets the camera
            this._camera = new Camera(params.coordinates[0][0], params.coordinates[0][1]);
            // renders the scene
            this.render();
        });
    }
    /**
     * Map layers initialization
     * @param {string[] | ILayerData[]} data Object containing the layers. If data is null, then it tries to load data from disk.
     */
    initLayers(layers) {
        return __awaiter(this, void 0, void 0, function* () {
            // loop over the index file
            for (const element of layers) {
                const layer = typeof element === 'string' ? yield DataApi.getLayer(element) : element;
                // skips the layer
                if ('skip' in layer && layer['skip']) {
                    continue;
                }
                // adds the new layer
                yield this.addLayer(layer);
                // renders the layer
                this.render();
            }
        });
    }
    /**
     * Add layer geometry and function function
     */
    addLayer(layerInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            // gets the layer geometry if available
            const features = 'data' in layerInfo ? layerInfo.data : undefined;
            // loads the layers data
            const layer = this._layerManager.createLayer(layerInfo);
            // not able to create the layer
            if (!layer) {
                return;
            }
            // loads the shaders
            yield layer.loadShaders(this._glContext);
            // update the features
            layer.updateFeatures(this._glContext, features);
            // render
            this.render();
        });
    }
    /**
     * update layer function function
     */
    updateLayerFunction(layerInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            // searches the layer
            let layer = null;
            for (const lay of this._layerManager.layers) {
                if (lay.layerId === layerInfo.id) {
                    layer = lay;
                    break;
                }
            }
            // gets the layer geometry if available
            const features = 'data' in layerInfo ? layerInfo['data'] : null;
            // not found or no data
            if (layer === null || !features) {
                return;
            }
            // update the function
            layer.updateFunction(this._glContext, features);
            // render
            this.render();
        });
    }
    /**
     * update layer function function
     */
    highlight(name, ids) {
        // searches the layer
        let layer = null;
        for (const lay of this._layerManager.layers) {
            console.log(lay.layerId, name);
            if (lay.layerId === name) {
                layer = lay;
                break;
            }
        }
        if (layer) {
            console.log(layer);
            // update the function
            layer.highlight(this._glContext, ids);
            // render
            this.render();
        }
    }
    /**
     * update layer function function
     */
    resetColors(name, ids) {
        // searches the layer
        let layer = null;
        for (const lay of this._layerManager.layers) {
            console.log(lay.layerId, name);
            if (lay.layerId === name) {
                layer = lay;
                break;
            }
        }
        if (layer) {
            console.log(layer);
            // update the function
            layer.updateStyle(this._glContext);
            // render
            this.render();
        }
    }
    /**
     * Inits the mouse events
     */
    initMouseEvents() {
        // creates the mouse events manager
        this._mouse = new MouseEvents(this);
        // binds the mouse events
        this._mouse.bindEvents();
    }
    /**
     * Inits the mouse events
     */
    initKeyboardEvents() {
        // creates the mouse events manager
        this._keyboard = new KeyEvents(this);
        // binds the mouse events
        this._keyboard.bindEvents();
    }
    /**
     * inits the window events
     */
    initWindowEvents() {
        // resize listener
        window.addEventListener('resize', () => {
            // resizes the canvas
            this.resize();
            this.render();
        });
    }
    /**
     * Renders the map
     */
    render() {
        if (!this._camera) {
            return;
        }
        // sky
        const sky = MapStyle.getColor('sky').concat([1.0]);
        this._glContext.clearColor(sky[0], sky[1], sky[2], sky[3]);
        // tslint:disable-next-line:no-bitwise
        this._glContext.clear(this._glContext.COLOR_BUFFER_BIT | this._glContext.DEPTH_BUFFER_BIT);
        // updates the camera
        this._camera.update();
        // render the layers
        for (const layer of this._layerManager.layers) {
            // skips based on visibility
            if (!layer.visible) {
                continue;
            }
            // sends the camera
            layer.camera = this.camera;
            // render
            layer.render(this._glContext);
        }
    }
    /**
     * Resizes the html canvas
     */
    resize() {
        const targetWidth = this._mapDiv.clientWidth;
        const targetHeight = this._mapDiv.clientHeight;
        const value = Math.max(targetWidth, targetHeight);
        this._glContext.viewport(0, 0, value, value);
        //
        this._canvas.width = targetWidth;
        this._canvas.height = targetHeight;
        // stores in the camera
        this._camera.setViewportResolution(targetWidth, targetHeight);
    }
    /**
     * Changes the map style.
     */
    changeStyle(name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield MapStyle.setColor(name, data);
            for (const layer of this._layerManager.layers) {
                layer.updateStyle(this._glContext);
            }
            this.render();
        });
    }
}

export { Camera, ColorMap, ColorMapTypes, DataApi, DataLoader, Environment, GeoUtils, KeyEvents, Layer, LayerManager, LayerTypes, LineLayer, MapView, MapViewStatus, MouseEvents, PointLayer, TriangleLayer };
//# sourceMappingURL=urbantkmap.js.map
