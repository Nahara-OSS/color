import type { Chromaticity } from "../rgb.ts";
import * as datatype from "./datatype.ts";
import type { Xyz } from "./types.ts";

/**
 * Tag information, including tag signature, offset in ICC profile data and the size of tag data. If the tag data type
 * is recognizable, the optional `data` field will be populated.
 */
export interface Tag {
    signature: string;
    offset: number;
    size: number;
    data?: TagData;
}

/**
 * A table of tags in ICC profile.
 */
export interface IccTagTable {
    /**
     * Media white point.
     */
    wtpt?: Tag & { data: XyzTagData };
    rXYZ?: Tag & { data: XyzTagData };
    gXYZ?: Tag & { data: XyzTagData };
    bXYZ?: Tag & { data: XyzTagData };
    rTRC?: Tag & { data: CurveTagData };
    gTRC?: Tag & { data: CurveTagData };
    bTRC?: Tag & { data: CurveTagData };
    chrm?: Tag & { data: ChromaticityTagData };

    [x: string]: Tag | undefined;
}

/**
 * Parse tag table from ICC profile data.
 * @param buffer The buffer holding ICC profile file data.
 * @param start The position for the start of ICC profile data in buffer.
 * @param offset The starting position of tag table, relative to start of ICC profile file. Default is 128.
 */
export function getTagTable(buffer: Uint8Array, start: number = 0, offset: number = 128): IccTagTable {
    const count = datatype.getUint32(buffer, start + offset + 0);
    const table: IccTagTable = {};

    for (let i = 0; i < count; i++) {
        const base = start + offset + 4 + i * 12;
        const signature = datatype.getSignature(buffer, base + 0);
        const tagOffset = datatype.getUint32(buffer, base + 4);
        const tagSize = datatype.getUint32(buffer, base + 8);
        table[signature] = { signature, offset: tagOffset, size: tagSize };

        const typeSignature = datatype.getSignature(buffer, start + tagOffset);
        const parser = tagDataParsers[typeSignature as keyof TagDataParsers];
        if (!parser) continue;
        table[signature].data = parser(buffer, start + tagOffset, tagSize);
    }

    return table;
}

interface XyzTagData {
    type: "XYZ ";
    values: Xyz[];
}

interface CurveTagData {
    type: "curv";
    values: Uint16Array;
}

interface ChromaticityTagData {
    type: "chrm";
    colorantType: number;
    channels: Chromaticity[];
}

export type TagData =
    | XyzTagData
    | CurveTagData
    | ChromaticityTagData;

export type TagDataFromType<K extends string, T extends TagData = TagData> = T extends { type: K } ? T : never;
export type TagDataParser<T extends TagData> = (buffer: Uint8Array, offset: number, size: number) => T;
export type TagDataParsers = { [x in TagData["type"]]: TagDataParser<TagDataFromType<x>>; }

/**
 * A map of tag parsers, with key corresponding to type signature and value is a function that parses tag data.
 */
export const tagDataParsers: TagDataParsers = {
    "XYZ "(buffer, offset, size) {
        const values: Xyz[] = [];
        let xyzBase = offset + 8;

        while (xyzBase < offset + size) {
            values.push(datatype.getXyz(buffer, xyzBase));
            xyzBase += 12;
        }

        return { type: "XYZ ", values };
    },

    "curv"(buffer, offset) {
        const count = datatype.getUint32(buffer, offset + 8);
        const values = new Uint16Array(count);
        for (let i = 0; i < count; i++) values[i] = datatype.getUint16(buffer, offset + 12 + i * 2);
        return { type: "curv", values };
    },

    "chrm"(buffer, offset) {
        const channelCount = datatype.getUint16(buffer, offset + 8);
        const colorantType = datatype.getUint16(buffer, offset + 10);
        const channels: Chromaticity[] = [];

        for (let i = 0; i < channelCount; i++) {
            const x = datatype.getU16Fixed16(buffer, offset + 12 + i * 8);
            const y = datatype.getU16Fixed16(buffer, offset + 16 + i * 8);
            channels.push({ x, y });
        }

        return { type: "chrm", colorantType, channels };
    }
};