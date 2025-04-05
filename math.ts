/**
 * Math module for working with colors, mostly consists of linear algebra.
 * @module
 */

/**
 * A 3x3 matrix, mainly used for transforming color from one space to another.
 */
export interface Matrix3x3 {
    m00: number; m01: number; m02: number;
    m10: number; m11: number; m12: number;
    m20: number; m21: number; m22: number;
}

/**
 * A vector with 3 components.
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Inverse a 3x3 matrix.
 * @param param0 The original matrix.
 * @returns The inverse of given matrix.
 */
export function invertMat({ m00, m01, m02, m10, m11, m12, m20, m21, m22 }: Matrix3x3): Matrix3x3 {
    const det =
        m00 * (m11 * m22 - m21 * m12) -
        m01 * (m10 * m22 - m12 * m20) +
        m02 * (m10 * m21 - m11 * m20);
    const invdet = 1 / det;
    return {
        m00: +(m11 * m22 - m12 * m21) * invdet,
        m01: -(m01 * m22 - m02 * m21) * invdet,
        m02: +(m01 * m12 - m02 * m11) * invdet,
        m10: -(m10 * m22 - m12 * m20) * invdet,
        m11: +(m00 * m22 - m02 * m20) * invdet,
        m12: -(m00 * m12 - m02 * m10) * invdet,
        m20: +(m10 * m21 - m11 * m20) * invdet, 
        m21: -(m00 * m21 - m01 * m20) * invdet,
        m22: +(m00 * m11 - m01 * m10) * invdet,
    };
}

/**
 * Transform vector by multiplying matrix with vector (matrix before vector/`M * v`).
 * @param param0 The matrix.
 * @param x X component of vector.
 * @param y Y component of vector.
 * @param z Z component of vector.
 * @returns Transformed vector.
 */
export function matMulMV({ m00, m01, m02, m10, m11, m12, m20, m21, m22 }: Matrix3x3, x: number, y: number, z: number): Vector3 {
    return {
        x: m00 * x + m01 * y + m02 * z,
        y: m10 * x + m11 * y + m12 * z,
        z: m20 * x + m21 * y + m22 * z,
    };
}

/**
 * Clamp value to `[0.00; 1.00]`.
 * @param x The value.
 * @returns The clamped value.
 */
export function clamp01(x: number): number {
    if (x < 0) x = 0;
    if (x > 1) x = 1;
    return x;
}