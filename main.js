import { Mountains } from "./modules/mountains.js";

export const farMountains = globalThis.farMountains = new Mountains("far-mountains-shape", {maxElevation: 40});
export const nearMountains = globalThis.nearMountains = new Mountains("near-mountains-shape", {maxElevation: 20});

console.log("Instantiated mountains:", farMountains, nearMountains);

farMountains.play(0.01);
nearMountains.play(0.02);