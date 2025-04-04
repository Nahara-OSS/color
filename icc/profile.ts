/**
 * ICC profile parsing module. Currently incomplete.
 * @module
 */

import type { Xyz } from "./types.ts";
import * as datatype from "./datatype.ts";

export interface IccHeader {
    readonly offset: number;
    profileSize: number;
    preferredCmmType: string;
    version: [number, number, number];
    profileClass: ProfileClass;
    colorSpace: ColorSpace;
    pcsType: ColorSpace.XYZ | ColorSpace.Lab;
    creationDate: Date;
    creationPlatform: string;
    profileFlags: ProfileFlag;
    deviceManufacturer?: string;
    deviceModel?: string;
    deviceAttributes: DeviceAttribute;
    renderingIntent: RenderingIntent;
    pcsWhitePoint: Xyz;
    profileCreator?: string;
    profileId?: string;
}

export class IccHeaderMapper implements IccHeader {
    constructor(
        public readonly buffer: Uint8Array,
        public readonly offset: number = 0
    ) {}

    get profileSize(): number { return datatype.getUint32(this.buffer, this.offset + 0); }
    get preferredCmmType(): string { return datatype.getSignature(this.buffer, this.offset + 4); }
    get version(): [number, number, number] {
        const major = this.buffer[this.offset + 8];
        const merged = this.buffer[this.offset + 9];
        const patch = (merged & 0xF0) >> 4;
        const minor = merged & 0x0F;
        return [major, minor, patch];
    }
    get profileClass(): ProfileClass { return datatype.getSignature(this.buffer, this.offset + 12) as ProfileClass; }
    get colorSpace(): ColorSpace { return datatype.getSignature(this.buffer, this.offset + 16) as ColorSpace; }
    get pcsType(): ColorSpace.XYZ | ColorSpace.Lab { return datatype.getSignature(this.buffer, this.offset + 20) as (ColorSpace.XYZ | ColorSpace.Lab); }
    get creationDate(): Date { return datatype.getDatetime(this.buffer, this.offset + 24); }
    get creationPlatform(): string { return datatype.getSignature(this.buffer, this.offset + 40); }
    get profileFlags(): ProfileFlag { return datatype.getUint32(this.buffer, this.offset + 44); }
    get deviceAttributes(): DeviceAttribute { return Number(datatype.getUint64(this.buffer, this.offset + 56)); }
    get renderingIntent(): RenderingIntent { return Number(datatype.getUint64(this.buffer, this.offset + 64)); }
    get pcsWhitePoint(): Xyz { return datatype.getXyz(this.buffer, this.offset + 68); }
}

export enum ProfileClass {
    Input      = "scnr",
    Display    = "mntr",
    Output     = "prtr",
    DeviceLink = "link",
    ColorSpace = "spac",
    Abstract   = "abst",
    NamedColor = "nmcl",
}

export enum ColorSpace {
    XYZ   = "XYZ ",
    Lab   = "Lab ",
    Luv   = "Luv ",
    YCbCr = "YCbr",
    Yxy   = "Yxy ",
    RGB   = "RGB ",
    Gray  = "GRAY",
    HSV   = "HSV ",
    HLS   = "HLS ",
    CMYK  = "CMYK",
    CMY   = "CMY ",
}

export enum ProfileFlag {
    Embedded     = 0x00000001,
    Undetachable = 0x00000002,
}

export enum DeviceAttribute {
    Transparency     = 0x00000001,
    Matte            = 0x00000002,
    PositivePolarity = 0x00000004,
    BlackWhite       = 0x00000008,
}

export enum RenderingIntent {
    Perceptual = 0,
    RelativeColorimetric = 1,
    Saturation = 2,
    AbsoluteColorimetric = 3,
}