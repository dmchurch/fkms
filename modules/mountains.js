import { BackdropElement } from "./backdrop.js";

export class DiagonalMountains extends BackdropElement {
    /** @type {number} */
    lastElevation;

    /**
     * @param {string} pathId ID of the <path> SVG element
     * @param {Partial<DiagonalMountains>} [options] Properties to assign on this object
     */
    constructor(pathId, options = {}) {
        super(pathId, options);

        this.lastElevation = options.elevationStart ?? this.elevationStart;
    }

    getNextRenderMin() {
        const segment = this.pathSegments[0];
        const [_, x, _y] = segment.split(" ");
        return parseFloat(x);
    }

    removeFirstPathSegment() {
        const segment = this.pathSegments.shift();
        const [_, x, y] = segment.split(" ");
        this.renderMin = parseFloat(x);
        this.elevationStart = parseFloat(y);
    }

    addNextPathSegment() {
        const newElevation = this.randomElevation();
        const distance = Math.abs(newElevation - this.lastElevation);
        this.renderMax += distance;
        this.pathSegments.push(`L ${this.renderMax} ${newElevation}`);
        this.lastElevation = newElevation;
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

    getNextRenderMin() {
        const segment = this.pathSegments[0];
        const [_, x, _y] = segment.split(" ");
        return parseFloat(x);
    }

    removeFirstPathSegment() {
        const segment = this.pathSegments.shift();
        const [_, x, y] = segment.split(" ");
        this.renderMin = parseFloat(x);
        this.elevationStart = parseFloat(y);
    }

    addNextPathSegment() {
        const newElevation = this.randomElevation();
        this.renderMax += this.pointDistance;
        this.pathSegments.push(`L ${this.renderMax} ${newElevation}`);
    }
}