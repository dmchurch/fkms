import { BackdropElement } from "./backdrop.js";

export class DiagonalMountains extends BackdropElement {
    /** @param {{x: number, y: number}} cursor */
    generatePathSegment(cursor) {
        const newElevation = this.randomElevation();
        const distance = Math.abs(newElevation - cursor.y);
        cursor.x += distance;
        cursor.y = newElevation;
        return `L ${cursor.x} ${cursor.y}`;
    }
}

export class RandomMountains extends BackdropElement {
    /** @type {number} */
    pointDistance;

    /**
     * @param {string} pathId ID of the <path> SVG element
     * @param {Partial<RandomMountains>} [options] Properties to assign on this object
     */
    constructor(pathId, options = {}) {
        super(pathId, options);
        this.pointDistance = options.pointDistance ?? 1;
    }

    /** @param {{x: number, y: number}} cursor */
    generatePathSegment(cursor) {
        cursor.x += this.pointDistance;
        cursor.y = this.randomElevation();
        return `L ${cursor.x} ${cursor.y}`;
    }
}