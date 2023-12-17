export class Mountains {
    /** @type {SVGPolygonElement} */
    polygon;

    /** @type {SVGSVGElement} */
    svg;

    renderMin = 0;
    renderMax = 0;

    minElevation;
    maxElevation;

    /** @type {number} */
    lastElevation;

    /**
     * @param {string} polygonId ID of the <polygon> SVG element
     * @param {number=} maxElevation Maximum elevation of mountains; defaults to full height of SVG's viewport
     * @param {number=} minElevation Minimum elevation of mountains; default 0
     */
    constructor(polygonId, maxElevation, minElevation) {
        const element = document.getElementById(polygonId);
        if (!(element instanceof SVGPolygonElement)) {
            throw new TypeError(`Element ${polygonId} is not a <polygon> element!`);
        }
        this.polygon = element;
        this.svg = element.ownerSVGElement;

        this.polygon.points.initialize(this.createPoint(0, 0)); // lower-right corner
        this.polygon.points.appendItem(this.createPoint(0, 0)); // lower-left corner

        this.minElevation = minElevation ?? 0;
        this.maxElevation = maxElevation ?? element.ownerSVGElement.viewBox.animVal.height;
        this.update();
    }

    update() {
        const renderTarget = this.svg.viewBox.animVal.x + this.svg.viewBox.animVal.width;

        while (this.renderMax < renderTarget) {
            const newElevation = Math.random() * (this.maxElevation - this.minElevation) + this.minElevation;
            if (this.lastElevation != undefined) {
                const distance = Math.abs(newElevation - this.lastElevation);
                this.renderMax += distance;
            }
            this.lastElevation = newElevation;
            this.polygon.points.appendItem(this.createPoint(this.renderMax, -newElevation));
        }

        // set the first point (lower-right corner) to the new right side
        this.polygon.points.getItem(0).x = this.renderMax;
    }

    createPoint(x, y) {
        const point = this.svg.createSVGPoint();
        point.x = x;
        point.y = y;
        return point;
    }

}