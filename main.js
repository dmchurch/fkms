import { DiagonalHills, DiagonalMountains, RandomHills, RandomMountains } from "./modules/mountains.js";

export const farMountains = globalThis.farMountains = new RandomMountains("far-mountains-shape", {elevationMax: -40, pointDistance: 10});
export const nearMountains = globalThis.nearMountains = new DiagonalHills("near-mountains-shape", {elevationMax: -20, elevationMin: -5});

console.log("Instantiated mountains:", farMountains, nearMountains);

farMountains.play(0.01);
nearMountains.play(0.02);