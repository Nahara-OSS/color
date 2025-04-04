/**
 * The RGB color space module, containing functions for calculating RGB/XYZ conversion matrices, as well as color
 * profile instance implementation.
 * 
 * ```ts
 * import { rgb } from "@nahara/color";
 * 
 * // 1. Display sRGB color on cinema projector
 * const srgb = new rgb.RgbProfile(rgb.srgb);
 * const p3 = new rgb.RgbProfile(rgb.P3DCI);
 * const color = srgb.to(p3, { r: 1, g: 0.2, b: 0.2 });
 * 
 * // 2. Calculate matrix for use in shader
 * p3.conversion.sdr.xyz; // RGB to XYZ
 * p3.conversion.sdr.rgb; // XYZ to RGB
 * ```
 * 
 * @module
 */

import { apply, applyInverse, type Curve } from "./curve.ts";
import { clamp01, invertMat, matMulMV, type Matrix3x3 } from "./math.ts";
import type { IColorProfile, XyzColor } from "./profile.ts";

export interface RgbColor { r: number; g: number; b: number; }
export interface Chromaticity { x: number; y: number; }

export interface RgbProfileInfo {
    /**
     * The red, green and blue primaries of this RGB color profile, including chromaticity and transfer function to
     * convert between linear and gamma-corrected.
     */
    primaries: RgbPrimaries;

    /**
     * The reference white point, including chromaticity of white point and its luminance (only applicable for high
     * dynamic range).
     */
    whitePoint: WhitePoint;
}

export interface RgbPrimaries {
    r: RgbPrimary;
    g: RgbPrimary;
    b: RgbPrimary;
}

export interface RgbPrimary {
    /**
     * The chromaticity coordinates of this primary.
     */
    chromaticity: Chromaticity;

    /**
     * The transfer function to apply on this primary.
     */
    trc: Curve;
}

export interface WhitePoint {
    /**
     * The chromaticity of reference white point.
     */
    chromaticity: Chromaticity;

    /**
     * The luminance of reference white point, measured in `cd/m^2`.
     */
    luminance: number;
}

export interface RgbMatrices {
    /**
     * Matrix to convert from linear RGB or XYZ.
     */
    xyz: Matrix3x3;

    /**
     * Matrix to convert from XYZ to linear RGB.
     */
    rgb: Matrix3x3;
}

/**
 * Calculate linear RGB <=> XYZ conversion matrices.
 * @param r The chromaticity of red colorant.
 * @param g The chromaticity of green colorant.
 * @param b The chromaticity of blue colorant.
 * @param w The tristimulus of white point. The Y component is the luminance of white point (also known as cd/m^2 or
 * nits).
 * @returns Conversion matrices for converting to XYZ or RGB.
 */
export function calcMatrices(r: Chromaticity, g: Chromaticity, b: Chromaticity, w: XyzColor): RgbMatrices {
    const Rxyz = { ...r, z: 1 - r.x - r.y };
    const Gxyz = { ...g, z: 1 - g.x - g.y };
    const Bxyz = { ...b, z: 1 - b.x - b.y };

    const { x: sumRXYZ, y: sumGXYZ, z: sumBXYZ } = matMulMV(invertMat({
        m00: Rxyz.x, m01: Gxyz.x, m02: Bxyz.x,
        m10: Rxyz.y, m11: Gxyz.y, m12: Bxyz.y,
        m20: Rxyz.z, m21: Gxyz.z, m22: Bxyz.z,
    }), w.x, w.y, w.z);

    const M: Matrix3x3 = {
        m00: Rxyz.x * sumRXYZ, m01: Gxyz.x * sumGXYZ, m02: Bxyz.x * sumBXYZ,
        m10: Rxyz.y * sumRXYZ, m11: Gxyz.y * sumGXYZ, m12: Bxyz.y * sumBXYZ,
        m20: Rxyz.z * sumRXYZ, m21: Gxyz.z * sumGXYZ, m22: Bxyz.z * sumBXYZ
    };

    return {
        xyz: M,
        rgb: invertMat(M)
    };
}

export interface RgbConversionInfo {
    sdr: RgbMatrices;
    hdr: RgbMatrices;
}

/**
 * Calculate conversion matrices for both SDR and HDR.
 * @param r The chromaticity of red colorant.
 * @param g The chromaticity of green colorant.
 * @param b The chromaticity of blue colorant.
 * @param w White point information.
 * @returns Conversion matrices.
 */
export function calcConversionInfo(r: Chromaticity, g: Chromaticity, b: Chromaticity, w: WhitePoint): RgbConversionInfo {
    const sdrWhitePoint: XyzColor = {
        x: w.chromaticity.x,
        y: w.chromaticity.y,
        z: 1 - w.chromaticity.x - w.chromaticity.y,
    };
    const hdrWhitePoint: XyzColor = {
        x: sdrWhitePoint.x * w.luminance,
        y: sdrWhitePoint.y * w.luminance,
        z: sdrWhitePoint.z * w.luminance
    };
    return {
        sdr: calcMatrices(r, g, b, sdrWhitePoint),
        hdr: calcMatrices(r, g, b, hdrWhitePoint),
    };
}

export class RgbProfile implements IColorProfile<RgbProfileInfo, RgbColor> {
    readonly colorSpace: string = "rgb";
    readonly conversion: RgbConversionInfo;

    constructor(public readonly serializable: RgbProfileInfo) {
        this.conversion = calcConversionInfo(
            serializable.primaries.r.chromaticity,
            serializable.primaries.g.chromaticity,
            serializable.primaries.b.chromaticity,
            serializable.whitePoint
        );
    }

    toXyz({ r, g, b }: RgbColor, hdr: boolean = false): XyzColor {
        r = applyInverse(this.serializable.primaries.r.trc, clamp01(r));
        g = applyInverse(this.serializable.primaries.g.trc, clamp01(g));
        b = applyInverse(this.serializable.primaries.b.trc, clamp01(b));
        const matrices = hdr ? this.conversion.hdr : this.conversion.sdr;
        return matMulMV(matrices.xyz, r, g, b);
    }

    fromXyz({ x, y, z }: XyzColor, hdr: boolean = false): RgbColor {
        const matrices = hdr ? this.conversion.hdr : this.conversion.sdr;
        let { x: r, y: g, z: b } = matMulMV(matrices.rgb, x, y, z);
        r = apply(this.serializable.primaries.r.trc, clamp01(r));
        g = apply(this.serializable.primaries.g.trc, clamp01(g));
        b = apply(this.serializable.primaries.b.trc, clamp01(b));
        return { r, g, b };
    }

    to<TTarget>(profile: IColorProfile<unknown, TTarget>, color: RgbColor, hdr?: boolean): TTarget {
        return profile.fromXyz(this.toXyz(color, hdr), hdr);
    }
}

// https://www.color.org/srgb04.xalter
/**
 * Linear sRGB (Rec. 709) with identity TRC function.
 */
export const linearSrgb: RgbProfileInfo = {
    primaries: {
        r: { chromaticity: { x: 0.64, y: 0.33 }, trc: { type: "identity" } },
        g: { chromaticity: { x: 0.30, y: 0.60 }, trc: { type: "identity" } },
        b: { chromaticity: { x: 0.15, y: 0.06 }, trc: { type: "identity" } },
    },
    whitePoint: {
        chromaticity: { x: 0.3127, y: 0.3290 },
        luminance: 80
    },
};

/**
 * sRGB with gamma 2.2 as TRC function. This is the most common display color profile for web.
 */
export const srgb: RgbProfileInfo = {
    primaries: {
        r: { chromaticity: { x: 0.64, y: 0.33 }, trc: { type: "gamma", gamma: 2.2 } },
        g: { chromaticity: { x: 0.30, y: 0.60 }, trc: { type: "gamma", gamma: 2.2 } },
        b: { chromaticity: { x: 0.15, y: 0.06 }, trc: { type: "gamma", gamma: 2.2 } },
    },
    whitePoint: {
        chromaticity: { x: 0.3127, y: 0.3290 },
        luminance: 80
    },
};

// https://www.color.org/chardata/rgb/DCIP3.xalter
/**
 * DCI-P3 with D65 white point, 48 cd/m^2.
 */
export const P3D65: RgbProfileInfo = {
    primaries: {
        r: { chromaticity: { x: 0.680, y: 0.32 }, trc: { type: "gamma", gamma: 2.6 } },
        g: { chromaticity: { x: 0.265, y: 0.69 }, trc: { type: "gamma", gamma: 2.6 } },
        b: { chromaticity: { x: 0.150, y: 0.06 }, trc: { type: "gamma", gamma: 2.6 } },
    },
    whitePoint: {
        chromaticity: { x: 0.3127, y: 0.3290 },
        luminance: 48
    }
};

/**
 * DCI-P3 with DCI white point, 48 cd/m^2. For use with cinema projectors.
 */
export const P3DCI: RgbProfileInfo = {
    ...P3D65,
    whitePoint: {
        chromaticity: { x: 0.3140, y: 0.3510 },
        luminance: 48
    }
};