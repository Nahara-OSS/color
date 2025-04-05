/**
 * ICC profile parsing module. Currently incomplete.
 * @module
 */

import type { Xyz } from "./types.ts";
import * as datatype from "./datatype.ts";

export interface IccHeader {
    profileSize: number;
    preferredCmmType: string;
    version: [number, number, number];
    profileClass: ProfileClass;
    profileSpace: ColorSpace;
    pcsSpace: ColorSpace.XYZ | ColorSpace.Lab;
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

export function getHeader(buffer: Uint8Array, offset: number = 0): IccHeader {
    const profileSize = datatype.getUint32(buffer, offset + 0);
    const preferredCmmType = datatype.getSignature(buffer, offset + 4);
    const versionMajor = buffer[offset + 8];
    const versionMinorPatch = buffer[offset + 9];
    const versionPatch = (versionMinorPatch & 0xF0) >> 4;
    const versionMinor = versionMinorPatch & 0x0F;
    const version: [number, number, number] = [versionMajor, versionMinor, versionPatch];
    const profileClass = datatype.getSignature(buffer, 12) as ProfileClass;
    const profileSpace = datatype.getSignature(buffer, 16) as ColorSpace;
    const pcsSpace = datatype.getSignature(buffer, 20) as ColorSpace.XYZ | ColorSpace.Lab;
    const creationDate = datatype.getDatetime(buffer, 24);
    // const signature = datatype.getSignature(buffer, 36);
    const creationPlatform = datatype.getSignature(buffer, 40);
    const profileFlags = datatype.getUint32(buffer, 44);
    const deviceManufacturer = datatype.getSignature(buffer, 48);
    const deviceModel = datatype.getSignature(buffer, 52);
    const deviceAttributes = Number(datatype.getUint64(buffer, 56)) as DeviceAttribute;
    const renderingIntent = datatype.getUint32(buffer, 64) as RenderingIntent;
    const pcsWhitePoint = datatype.getXyz(buffer, 68);

    return {
        profileSize, preferredCmmType, version,
        profileClass, profileSpace, pcsSpace,
        creationDate, creationPlatform,
        profileFlags,
        deviceManufacturer, deviceModel, deviceAttributes,
        renderingIntent, pcsWhitePoint
    };
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