/**
 * Module for reading or writing various ICC data types on `Uint8Array` buffer.
 * @module
 */

import type { Xyz } from "./types.ts";

export function getUint16(buffer: Uint8Array, offset: number = 0): number {
    return (buffer[offset + 0] << 8) | buffer[offset + 1];
}

export function setUint16(buffer: Uint8Array, value: number, offset: number = 0): void {
    buffer[offset + 0] = (value & 0xFF00) >> 8;
    buffer[offset + 1] = (value & 0x00FF);
}

export function getUint32(buffer: Uint8Array, offset: number = 0): number {
    return (buffer[offset + 0] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
}

export function setUint32(buffer: Uint8Array, value: number, offset: number = 0): void {
    buffer[offset + 0] = (value & 0xFF000000) >> 24;
    buffer[offset + 1] = (value & 0x00FF0000) >> 16;
    buffer[offset + 2] = (value & 0x0000FF00) >> 8;
    buffer[offset + 3] = (value & 0x000000FF);
}

export function getUint64(buffer: Uint8Array, offset: number = 0): bigint {
    return 0n |
        (BigInt(buffer[offset + 0]) << 56n) |
        (BigInt(buffer[offset + 1]) << 48n) |
        (BigInt(buffer[offset + 2]) << 40n) |
        (BigInt(buffer[offset + 3]) << 32n) |
        (BigInt(buffer[offset + 4]) << 24n) |
        (BigInt(buffer[offset + 5]) << 16n) |
        (BigInt(buffer[offset + 6]) << 8n) |
        (BigInt(buffer[offset + 7]));
}

export function setUint64(buffer: Uint8Array, value: bigint, offset: number = 0): void {
    buffer[offset + 0] = Number((value & 0xFF00000000000000n) >> 56n);
    buffer[offset + 1] = Number((value & 0x00FF000000000000n) >> 48n);
    buffer[offset + 2] = Number((value & 0x0000FF0000000000n) >> 40n);
    buffer[offset + 3] = Number((value & 0x000000FF00000000n) >> 32n);
    buffer[offset + 4] = Number((value & 0x00000000FF000000n) >> 24n);
    buffer[offset + 5] = Number((value & 0x0000000000FF0000n) >> 16n);
    buffer[offset + 6] = Number((value & 0x000000000000FF00n) >> 8n);
    buffer[offset + 7] = Number((value & 0x00000000000000FFn));
}

export function getS15Fixed16(buffer: Uint8Array, offset: number = 0): number {
    const raw = getUint32(buffer, offset);
    const neg = (raw & 0x80000000) != 0;
    const int = (raw & 0x7FFF0000) >> 16;
    const frac = raw & 0x0000FFFF;
    return (neg ? ~(~int & 0x7FFF) : int) + (frac / 0x10000);
}

export function setS15Fixed16(buffer: Uint8Array, value: number, offset: number = 0): void {
    const sint = Math.floor(value);
    const frac = Math.floor((value - sint) * 0x10000);
    const raw = ((sint & 0xFFFF) << 16) | frac;
    setUint32(buffer, raw, offset);
}

export function getU16Fixed16(buffer: Uint8Array, offset: number = 0): number {
    const raw = getUint32(buffer, offset);
    const int = (raw & 0xFFFF0000) >> 16;
    const frac = raw & 0x0000FFFF;
    return int + (frac / 0x10000);
}

export function setU16Fixed16(buffer: Uint8Array, value: number, offset: number = 0): void {
    const uint = Math.floor(value) & 0xFFFF;
    const frac = Math.floor((value - uint) * 0x10000);
    const raw = (uint << 16) | frac;
    setUint32(buffer, raw, offset);
}

export function getU1Fixed15(buffer: Uint8Array, offset: number = 0): number {
    const raw = getUint16(buffer, offset);
    const int = (raw & 0x8000) >> 15;
    const frac = raw & 0x7FFF;
    return int + (frac / 0x8000);
}

export function setU1Fixed15(buffer: Uint8Array, value: number, offset: number = 0): void {
    const uint = Math.floor(value) & 0x1;
    const frac = Math.floor((value - uint) * 0x8000);
    const raw = (uint << 15) | frac;
    setUint16(buffer, raw, offset);
}

export function getU8Fixed8(buffer: Uint8Array, offset: number = 0): number {
    const raw = getUint16(buffer, offset);
    const int = (raw & 0xFF00) >> 8;
    const frac = raw & 0x00FF;
    return int + (frac / 0x100);
}

export function setU8Fixed8(buffer: Uint8Array, value: number, offset: number = 0): void {
    const uint = Math.floor(value) & 0xFF;
    const frac = Math.floor((value - uint) * 0x100);
    const raw = (uint << 8) | frac;
    setUint16(buffer, raw, offset);
}

export function getFloat32(buffer: Uint8Array, offset: number = 0): number {
    return new Float32Array(new Uint32Array([getUint32(buffer, offset)]).buffer)[0];
}

export function setFloat32(buffer: Uint8Array, value: number, offset: number = 0): void {
    setUint32(buffer, new Uint32Array(new Float32Array([value]).buffer)[0], offset);
}

export function getDatetime(buffer: Uint8Array, offset: number = 0): Date {
    const year = getUint16(buffer, offset + 0);
    const month = getUint16(buffer, offset + 2);
    const day = getUint16(buffer, offset + 4);
    const hours = getUint16(buffer, offset + 6);
    const minutes = getUint16(buffer, offset + 8);
    const seconds = getUint16(buffer, offset + 10);
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

export function setDatetime(buffer: Uint8Array, value: Date, offset: number = 0): void {
    setUint16(buffer, value.getUTCFullYear(), offset + 0);
    setUint16(buffer, value.getUTCMonth() + 1, offset + 2);
    setUint16(buffer, value.getUTCDate(), offset + 4);
    setUint16(buffer, value.getUTCHours(), offset + 6);
    setUint16(buffer, value.getUTCMinutes(), offset + 8);
    setUint16(buffer, value.getUTCSeconds(), offset + 10);
}

export interface PositionNumber {
    offset: number;
    size: number;
}

export function getPositionNumber(buffer: Uint8Array, offset: number = 0): PositionNumber {
    const o = getUint32(buffer, offset + 0);
    const s = getUint32(buffer, offset + 4);
    return { offset: o, size: s };
}

export function setPositionNumber(buffer: Uint8Array, value: PositionNumber, offset: number = 0): void {
    setUint32(buffer, value.offset, offset + 0);
    setUint32(buffer, value.size, offset + 4);
}

export interface ResponseNumber {
    device: number;
    measurement: number;
}

export function getResponseNumber(buffer: Uint8Array, offset: number = 0): ResponseNumber {
    const device = getUint16(buffer, offset + 0);
    const measurement = getS15Fixed16(buffer, offset + 4);
    return { device, measurement };
}

export function setResponseNumber(buffer: Uint8Array, value: ResponseNumber, offset: number = 0): void {
    setUint16(buffer, value.device, offset + 0);
    setS15Fixed16(buffer, value.measurement, offset + 4);
}

export function getXyz(buffer: Uint8Array, offset: number = 0): Xyz {
    const x = getS15Fixed16(buffer, offset + 0);
    const y = getS15Fixed16(buffer, offset + 4);
    const z = getS15Fixed16(buffer, offset + 8);
    return { x, y, z };
}

export function setXyz(buffer: Uint8Array, value: Xyz, offset: number = 0): void {
    setS15Fixed16(buffer, value.x, offset + 0);
    setS15Fixed16(buffer, value.y, offset + 4);
    setS15Fixed16(buffer, value.z, offset + 8);
}

export function getSignature(buffer: Uint8Array, offset: number = 0): string {
    return String.fromCharCode(...buffer.subarray(offset, offset + 4));
}

export function setSignature(buffer: Uint8Array, value: string, offset: number = 0): void {
    value.split("").forEach((c, i) => buffer[offset + i] = c.charCodeAt(0));
}