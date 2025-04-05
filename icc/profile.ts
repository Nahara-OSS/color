import { apply, applyInverse, type Curve } from "../curve.ts";
import { invertMat, matMulMV, type Matrix3x3 } from "../math.ts";
import type { IColorProfile, XyzColor } from "../profile.ts";
import { ColorSpace, getHeader, type IccHeader } from "./header.ts";
import { type TagDataFromType, type IccTagTable, getTagTable } from "./tag.ts";

export interface IccProfileInfo {
    header: IccHeader;
    tags: IccTagTable;
}

/**
 * Parse ICC profile info from binary data. The data is the entire content of ICC profile file (`.icc`).
 * @param buffer The buffer containing ICC profile data in binary.
 * @param start The start offset of ICC profile data in buffer.
 * @returns Parsed ICC profile info.
 */
export function parseIcc(buffer: Uint8Array, start: number = 0): IccProfileInfo {
    return {
        header: getHeader(buffer, start),
        tags: getTagTable(buffer, start, 128)
    };
}

/**
 * Instantiate ICC profile for color conversion.
 * @param icc The ICC profile info.
 * @returns The ICC profile for color conversion.
 */
export function profileOf(icc: IccProfileInfo): IColorProfile<IccProfileInfo, number[]> {
    switch (icc.header.profileSpace) {
        case ColorSpace.RGB: return new IccRgbProfile(icc);
        default: throw new Error(`Unsupported color space: ${icc.header.profileSpace}`);
    }
}

function curveOf(curv: TagDataFromType<"curv">): Curve {
    if (curv.values.length == 0) return { type: "identity" };

    if (curv.values.length == 1) {
        const raw = curv.values[0];
        const int = (raw & 0xFF00) >> 8;
        const frac = raw & 0x00FF;
        const gamma = int + (frac / 0x100);
        return { type: "gamma", gamma };
    }

    const mapped = new Array<number>(curv.values.length);
    for (let i = 0; i < curv.values.length; i++) mapped[i] = curv.values[i] / 65535;
    return { type: "lut", values: mapped };
}

class IccRgbProfile implements IColorProfile<IccProfileInfo, number[]> {
    readonly serializable: IccProfileInfo;
    readonly colorSpace = "rgb";
    readonly xyzMatrix: Matrix3x3;
    readonly rgbMatrix: Matrix3x3;
    readonly trc: Curve[];

    constructor(icc: IccProfileInfo) {
        this.serializable = icc;
        const rXYZ = icc.tags.rXYZ!.data.values[0];
        const gXYZ = icc.tags.gXYZ!.data.values[0];
        const bXYZ = icc.tags.bXYZ!.data.values[0];
        this.xyzMatrix = {
            m00: rXYZ.x, m01: gXYZ.x, m02: bXYZ.x,
            m10: rXYZ.y, m11: gXYZ.y, m12: bXYZ.y,
            m20: rXYZ.z, m21: gXYZ.z, m22: bXYZ.z,
        };
        this.rgbMatrix = invertMat(this.xyzMatrix);
        this.trc = [
            curveOf(icc.tags.rTRC!.data),
            curveOf(icc.tags.gTRC!.data),
            curveOf(icc.tags.bTRC!.data)
        ];
    }

    toXyz([r, g, b]: number[], _hdr = false): XyzColor {
        return matMulMV(
            this.xyzMatrix,
            apply(this.trc[0], r),
            apply(this.trc[1], g),
            apply(this.trc[2], b)
        );
    }

    fromXyz({ x, y, z }: XyzColor, _hdr = false): number[] {
        const { x: r, y: g, z: b } = matMulMV(this.rgbMatrix, x, y, z);
        return [
            applyInverse(this.trc[0], r),
            applyInverse(this.trc[0], g),
            applyInverse(this.trc[0], b)
        ];
    }

    to<TTarget>(profile: IColorProfile<unknown, TTarget>, color: number[], hdr?: boolean): TTarget {
        return profile.fromXyz(this.toXyz(color, hdr), hdr);
    }
}