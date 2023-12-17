import { nextAnimationFrame } from "./helpers.js";

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

    speed = 0; // in units of vh (100vh is the height of the browser viewport) per millisecond

    #playing = false;
    #updateQueued = false;

    /**
     * @param {string} polygonId ID of the <polygon> SVG element
     * @param {number} [maxElevation] Maximum elevation of mountains; defaults to full height of SVG's viewport
     * @param {number} [minElevation] Minimum elevation of mountains; default 0
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
        this.update = this.update.bind(this)
        this.queueUpdate();
    }

    play(speed) {
        this.speed = speed;
        if (!this.#playing) {
            this.#animationLoop();
        }
    }

    stop() {
        this.speed = 0;
    }

    /** @param {IdleDeadline} [deadline] Optional deadline to restrict processing time */
    update(deadline) {
        const renderTarget = this.svg.viewBox.animVal.x + this.svg.viewBox.animVal.width;

        while (this.renderMax < renderTarget && (!deadline || deadline.timeRemaining() > 0)) {
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
        if (deadline) {
            this.#updateQueued = false;
        }
    }

    /** @param {IdleRequestOptions} [options] */
    queueUpdate(options) {
        if (!this.#updateQueued) {
            this.#updateQueued = true;
            requestIdleCallback(this.update, options);
        }
    }

    createPoint(x, y) {
        const point = this.svg.createSVGPoint();
        point.x = x;
        point.y = y;
        return point;
    }

    async #animationLoop() {
        this.#playing = true;
        let lastFrame = await nextAnimationFrame();
        const viewBox = this.svg.viewBox.baseVal;
        while (this.speed) {
            const frameTime = await nextAnimationFrame();
            const delta = (frameTime - lastFrame) * this.speed;
            lastFrame = frameTime;
            viewBox.x += delta; // scroll by adjusting the position of the SVG's viewport onto its infinite canvas
            if (viewBox.x + viewBox.width > this.renderMax) {
                // not time-critical, just add new polygons whenever you have a moment
                this.queueUpdate();
            }
        }
        this.#playing = false;
    }
}