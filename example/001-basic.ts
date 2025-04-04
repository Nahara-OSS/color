import { rgb } from "../mod.ts";

// RGB color profile conversion
// (for displaying on user's monitor correctly)
const srgb = new rgb.RgbProfile(rgb.srgb);
const displayP3 = new rgb.RgbProfile(rgb.P3D65);
console.log(srgb.to(displayP3, { r: 1, g: 0, b: 0 }));
console.log(srgb.to(displayP3, { r: 0, g: 1, b: 0 }));
console.log(srgb.to(displayP3, { r: 0, g: 0, b: 1 }));

// Custom RGB profile
const myProfile = new rgb.RgbProfile({
    primaries: rgb.linearSrgb.primaries,
    whitePoint: rgb.P3DCI.whitePoint
});
console.log(srgb.to(myProfile, { r: 0, g: 1, b: 0 }));