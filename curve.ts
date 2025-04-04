/**
 * The module for applying value to a curve.
 * 
 * ```ts
 * import { curve } from "@nahara/color";
 * 
 * curve.apply({ type: "gamma", gamma: 2.2 }, 0.4);
 * ```
 * @module
 */

/**
 * Pass input as-is.
 */
export interface IdentityCurve {
    type: "identity";
}

/**
 * Apply `x ** gamma` to input.
 */
export interface GammaCurve {
    type: "gamma";
    gamma: number;
}

/**
 * A custom curve with each index in list corresponding to a fraction of input and element corresponding to desired
 * value.
 */
export interface LutCurve {
    type: "lut";

    /**
     * A list of values. The first element (index 0) corresponding to input value `0.00`, the last element (index
     * `length - 1`) corresponding to input value `1.00`. Each element in this list is the target value for given input,
     * ranging from `0.00` to `1.00`.
     */
    values: number[];
}

export type Curve = IdentityCurve | GammaCurve | LutCurve;

/**
 * Passing input value to curve and get output value.
 * @param curve The normal curve.
 * @param x The input value.
 * @returns The output value.
 */
export function apply(curve: Curve, x: number): number {
    if (curve.type == "identity") return x;
    if (curve.type == "gamma") return x ** curve.gamma;
    if (curve.type == "lut") return curve.values[Math.round((curve.values.length - 1) * x)];
    throw new Error(`Curve type not implemented: ${(curve as Curve).type}`);
}

/**
 * Passing value to inverse of the curve and get output value.
 * @param curve The normal curve (not inverse).
 * @param y The input value.
 * @returns The output value.
 */
export function applyInverse(curve: Curve, y: number): number {
    if (curve.type == "identity") return y;
    if (curve.type == "gamma") return y ** (1 / curve.gamma);

    if (curve.type == "lut") {
        const search = binarySearch(curve.values, y);
        const insert = search >= 0 ? search : -search - 1;
        return insert / (curve.values.length - 1);
    }

    throw new Error(`Curve type not implemented: ${(curve as Curve).type}`);
}

function binarySearch(array: number[], value: number): number {
    let low = 0;
    let high = array.length - 1;

    while (low <= high) {
        const mid = (low + high) >> 1;
        if (array[mid] < value) low = mid + 1;
        else if (array[mid] > value) high = mid - 1;
        else return mid;
    }

    return -(low + 1);
}