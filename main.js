import { Mountains } from "./modules/mountains.js";

export const farMountains = globalThis.farMountains = new Mountains("far-mountains-polygon", 40);
export const nearMountains = globalThis.nearMountains = new Mountains("near-mountains-polygon", 20);

console.log("Instantiated mountains:", farMountains, nearMountains);