/**
 * The XYZ structure for representing color in XYZ space (either CIEXYZ or nCIEXYZ values). If high dynamic range mode
 * is enabled, this will be CIEXYZ, otherwise it will be nCIEXYZ, which is the uniformly scaled version of CIEXYZ so
 * that `Y = 1.00`.
 */
export interface XyzColor { x: number; y: number; z: number; }

export interface IColorProfile<TProfile, TCol> {
    /**
     * The name of color space tied to this profile.
     */
    readonly colorSpace: string;

    /**
     * The serializable version of this color profile instance. You can embed this in your save file for example.
     */
    readonly serializable: TProfile;

    /**
     * Convert color to CIEXYZ/nCIEXYZ.
     * @param color The color to convert from.
     * @param hdr Whether to use high dynamic range. If `true`, the XYZ values will be CIEXYZ, otherwise it will be
     * `nCIEXYZ`. By default, this value is `false`.
     */
    toXyz(color: TCol, hdr?: boolean): XyzColor;

    /**
     * Convert color from CIEXYZ/nCIEXYZ.
     * @param xyz The CIEXYZ/nCIEXYZ color to convert from, depending on HDR state.
     * @param hdr Whether to use high dynaic range. If `true`, the XYZ values will be treated as CIEXYZ, otherwise it
     * will be `nCIEXYZ`. By default, this value is `false`.
     */
    fromXyz(xyz: XyzColor, hdr?: boolean): TCol;

    /**
     * Convert from source color in this profile to destination profile. This will convert to XYZ first, the from XYZ to
     * destination.
     * @param profile The destination profile.
     * @param color The source color.
     * @param hdr Whether to use high dynamic range. If enabled, the result may be less bright if source profile's white
     * point strength weaker than destination's white point.
     */
    to<TTarget>(profile: IColorProfile<unknown, TTarget>, color: TCol, hdr?: boolean): TTarget;
}