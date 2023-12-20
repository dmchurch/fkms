import { BackdropElement } from "./backdrop.js";
import { CatmullRom } from "./catmull-rom.js";
import { Point } from "./geometry.js";
export class DiagonalMountains extends BackdropElement {
    /** @param {Point} cursor */
    generatePathSegment(cursor) {
        const newElevation = this.randomElevation();
        const distance = Math.abs(newElevation - cursor.y);
        cursor.x += distance;
        cursor.y = newElevation;
        return `L ${cursor}`;
    }
}

// use a Catmull-Rom spline to make a smooth path between points
export class DiagonalHills extends BackdropElement {
    /** @type {CatmullRom} */
    spline;

    /**
     * @param {string} pathId
     * @param {Partial<DiagonalHills & CatmullRom>} [options]
     */
    constructor(pathId, options = {}) {
        super(pathId, options);

        this.spline = options.spline ?? CatmullRom.fromOptions({cursor: this.cursorStart, ...options});
    }

    /** @param {Point} cursor */
    generatePathSegment(cursor) {
        cursor.updateFrom(this.spline.nextEndpoint);
        const newElevation = this.randomElevation();
        const distance = Math.abs(newElevation - cursor.y);
        const curveParams = this.spline.addPoint(new Point(cursor.x + distance, newElevation));
        return `C ${curveParams.join(" ")}`;
    }
}

export class RandomMountains extends BackdropElement {
    /** @type {number} */
    pointDistance;

    /**
     * @param {string} pathId ID of the <path> SVG element
     * @param {Partial<RandomMountains & CatmullRom>} [options] Properties to assign on this object
     */
    constructor(pathId, options = {}) {
        super(pathId, options);
        this.pointDistance = options.pointDistance ?? 1;
    }

    /** @param {Point} cursor */
    generatePathSegment(cursor) {
        cursor.x += this.pointDistance;
        cursor.y = this.randomElevation();
        return `L ${cursor}`;
    }
}

// RandomMountains, but with a C-R curve for smoothing
export class RandomHills extends BackdropElement {
    /** @type {CatmullRom} */
    spline;
    /** @type {number} */
    pointDistance;

    /**
     * @param {string} pathId
     * @param {Partial<RandomHills & CatmullRom>} [options]
     */
    constructor(pathId, options = {}) {
        super(pathId, options);

        this.pointDistance = options.pointDistance ?? 1;

        this.spline = options.spline ?? CatmullRom.fromOptions({cursor: this.cursorStart, ...options});

        // initial update
        this.update();
    }

    /** @param {Point} cursor */
    generatePathSegment(cursor) {
        cursor.updateFrom(this.spline.nextEndpoint);
        const curveParams = this.spline.addPoint(new Point(cursor.x + this.pointDistance, this.randomElevation()));
        return `C ${curveParams.join(" ")}`;
    }
}