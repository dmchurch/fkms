import { Point } from "./geometry.js";

/**
 * A generator for cubic splines that follow the Catmull-Rom algorithm. See example usage in {@link CatmullRom.addPoint()}.
 */
export class CatmullRom {
    /**
     * Convert a set of 4 Catmull-Rom constrol points to cubic Bezier, using the equations from
     * http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf (2)
     * 
     * @param {[Point, Point, Point, Point]} points
     * @returns {[Point, Point, Point, Point]}
     */
    static toCubic(points, alpha = 0.5) {
        // shorthand point names
        const [p0, p1, p2, p3] = points;
        // compute control distances (with preapplied alpha)
        const [d1, d2, d3] = points.slice(1).map((p, i) => Math.pow(p.distanceTo(points[i]), alpha));
        // precompute squares
        const [d1s, d2s, d3s] = [d1 * d1, d2 * d2, d3 * d3];
        // Equations, if we had operator overloading:
        // b1 = (d1s*p2 - d2s*p0 + (2*d1s + 3*d1*d2 + d2s)*p1)/(3*d1*(d1+d2))
        // b2 = (d3s*p1 - d2s*p3 + (2*d1s + 3*d3*d2 + d2s)*p2)/(3*d3*(d3+d2))
        const b1 = p2.times(d1s).minus(p0.times(d2s)).plus(p1.times(2*d1s + 3*d1*d2 + d2s)).dividedBy(3*d1*(d1+d2));
        const b2 = p1.times(d3s).minus(p3.times(d2s)).plus(p2.times(2*d3s + 3*d3*d2 + d2s)).dividedBy(3*d3*(d3+d2));

        return [p1, b1, b2, p2];
    }

    /** @param {Partial<CatmullRom> & Pick<CatmullRom,"cursor">} options  */
    static fromOptions(options) {
        return  new CatmullRom(
            options.cursor,
            options.nextEndpoint ?? options.cursor.plus({x: 0.1, y: 0.1}),
            options.previousPoint ?? options.cursor);
    }

    // The Catmull-Rom algorithm has to operate on 4 points at a time, so we hold three in memory.
    previousPoint = Point.invalid;
    cursor = Point.invalid;
    nextEndpoint = Point.invalid;

    /**
     * Create a new Catmull-Rom spline generator that starts drawing at {@link originCursor}.
     * @param {Point} originCursor 
     * @param {Point} firstEndpoint
     * @param {Point} [previousPoint]
     */
    constructor(originCursor, firstEndpoint, previousPoint=undefined) {
        this.previousPoint = previousPoint ?? originCursor; // if not specified, just set to the same as the origin point
        this.cursor = originCursor;
        this.nextEndpoint = firstEndpoint;
    }

    /**
     * Add a point to the end of the Catmull-Rom sequence and return the bezier for the second-to-last segment in the sequence.
     * @param {Point} newPoint The next point in the sequence. This will be the return value to the *next* call to {@link addPoint()}.
     * @returns {[Point, Point, Point]} The two control points and the endpoint following the cursor
     * 
     * @example
     * 
     * ```
     * const spline = new CatmullRom(new Point(1, 1), new Point(2, 2), new Point(1, 0));
     * console.log(spline.cursor);                          // Point(1, 1)
     * console.log(spline.nextEndpoint);                    // Point(2, 2)
     * console.log(spline.addPoint(new Point(3, 2)));       // [Point(1.1666..., 1.333...), Point(1.666..., 1.8333...), Point(2, 2)]
     * console.log(spline.addPoint(new Point(3, 3)));       // [Point(2.333..., 2.1666...), Point(2.8333..., 1.8333...), Point(3, 2)]
     * console.log(spline.cursor);                          // Point(3, 2)
     * console.log(spline.nextEndpoint);                    // Point(3, 3)
     * ```
     */
    addPoint(newPoint) {
        const [, ...bz] = CatmullRom.toCubic([this.previousPoint, this.cursor, this.nextEndpoint, newPoint]);

        // do the shuffle
        this.previousPoint = this.cursor;
        this.cursor = this.nextEndpoint;
        this.nextEndpoint = newPoint;

        return bz;
    }
}