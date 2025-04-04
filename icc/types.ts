/**
 * Represent tristimulus values for CIEXYZ, nCIEXYZ or PCSXYZ.
 * 
 * - CIEXYZ: XYZ tristimulus values. Y is expressed as cd/m^2 (also known as "nits").
 * - nCIEXYZ: uniformly scaled CIEXYZ so that Y = `1.00`.
 * - PCSXYZ: linear scaed such that X = `0.964`, Y = `1.0`, Z = `0.8249` for media white.
 */
export interface Xyz {
    x: number;
    y: number;
    z: number;
}

export interface Lab {
    l: number;
    a: number;
    b: number;
}