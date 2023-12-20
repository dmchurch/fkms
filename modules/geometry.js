/**
 * PointLike is just a type name meaning "has x and y number properties"
 * @typedef {{x: number, y: number}} PointLike
 */

export class Point {
    static zero = new Point(0, 0);
    static invalid = new Point(NaN, NaN);

    static Point() {
        // make the special Point values immutable
        Object.freeze(this.zero);
        Object.freeze(this.invalid);
    }

    /** @param {PointLike} pointLike */
    static from(pointLike) {
        return new Point(pointLike.x, pointLike.y);
    }

    /** @param {[number, number] | Iterable<number>} arrayLike */
    static of(arrayLike) {
        const [x, y] = arrayLike;
        return new Point(x, y);
    }

    /** @param {string} orderedPair  */
    static parse(orderedPair) {
        const [x, y] = orderedPair.split(",");
        return new Point(parseFloat(x), parseFloat(y));
    }

    x;
    y;

    get sqrMagnitude() {
        return this.x * this.x + this.y * this.y;
    }
    get magnitude() {
        return Math.sqrt(this.sqrMagnitude)
    }

    get isFinite() {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return `${this.x},${this.y}`;
    }

    /** @param {PointLike} other */
    updateFrom(other) {
        this.x = other.x;
        this.y = other.y;
    }

    /** @param {PointLike} other */
    plus(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    /** @param {PointLike} other */
    minus(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }

    /** @param {number} scalar  */
    times(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }

    /** @param {number} scalar  */
    dividedBy(scalar) {
        return new Point(this.x / scalar, this.y / scalar);
    }

    /** @param {PointLike} other */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    /** @param {PointLike} other */
    approx(other, epsilon = 0.000001) {
        return Math.abs(this.x - other.x) <= epsilon && Math.abs(this.y - other.y) <= epsilon;
    }

    sqrDistanceTo(other) {
        return this.minus(other).sqrMagnitude;
    }

    distanceTo(other) {
        return this.minus(other).magnitude;
    }

    /** @param {number} x */
    withX(x) {
        return new Point(x, this.y);
    }

    /** @param {number} y */
    withY(y) {
        return new Point(this.x, y);
    }

    [Symbol.iterator]() {
        return [this.x, this.y][Symbol.iterator]();
    }
}
