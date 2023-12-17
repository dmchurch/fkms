import { nextAnimationFrame } from "./helpers.js";

export class Mountains {
    /** @type {SVGPathElement} */
    path;

    /** @type {SVGSVGElement} */
    svg;

    renderMin = 0;
    renderMax = 0;

    minElevation = 0;
    maxElevation;

    baseElevation = 0;
    startElevation;

    /** @type {number} */
    lastElevation;

    speed = 0; // in units of vh (100vh is the height of the browser viewport) per millisecond

    #playing = false;
    #updateQueued = false;

    /** @type {string[]} */
    pathSegments = [];

    get pathStart() {
        // To start: move the cursor to the left side of the render window at starting elevation
        return `M ${this.renderMin},${this.startElevation}`;
    }
    get pathEnd() {
        // Drop a vertical to base elevation, horizontal back to left side of render window, then close the path
        return `V ${this.baseElevation} H ${this.renderMin} Z`;
    }

    /**
     * @param {string} pathId ID of the <path> SVG element
     * @param {Partial<Mountains>} [options] Properties to assign on this object
     */
    constructor(pathId, options = {}) {
        const element = document.getElementById(pathId);
        if (!(element instanceof SVGPathElement)) {
            throw new TypeError(`Element ${pathId} is not a <path> element!`);
        }
        this.path = element;
        this.svg = element.ownerSVGElement;
        this.update = this.update.bind(this);

        this.maxElevation = element.ownerSVGElement.viewBox.animVal.height;

        // set all overrides from passed-in options
        Object.assign(this, options);

        this.startElevation ??= this.randomElevation();
        this.lastElevation ??= this.startElevation;

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

    randomElevation() {
        return Math.random() * (this.minElevation - this.maxElevation) + this.minElevation;
    }

    /** @param {IdleDeadline} [deadline] Optional deadline to restrict processing time */
    update(deadline) {
        const viewBox = this.svg.viewBox.animVal;
        const renderTarget = viewBox.x + viewBox.width;

        // Add segments until we've rendered past the right edge of the viewport
        while (this.renderMax < renderTarget && (!deadline || deadline.timeRemaining() > 0)) {
            this.addNextPathSegment();
        }

        // Remove segments as long as we can do so and not cut into the left edge of the viewport
        while (this.pathSegments.length > 0 && this.getNextRenderMin() < viewBox.x && (!deadline || deadline.timeRemaining() > 0)) {
            this.removeFirstPathSegment();
        }

        // concatenate and set the d element
        this.path.setAttribute("d", `${this.pathStart} ${this.pathSegments.join(" ")} ${this.pathEnd}`);

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

    getNextRenderMin() {
        const segment = this.pathSegments[0];
        const [_, x, _y] = segment.split(" ");
        return parseFloat(x);
    }

    /** @protected */
    removeFirstPathSegment() {
        const segment = this.pathSegments.shift();
        const [_, x, y] = segment.split(" ");
        this.renderMin = parseFloat(x);
        this.startElevation = parseFloat(y);
    }

    /** @protected */
    addNextPathSegment() {
        const newElevation = this.randomElevation();
        const distance = Math.abs(newElevation - this.lastElevation);
        this.renderMax += distance;
        this.pathSegments.push(`L ${this.renderMax} ${newElevation}`);
        this.lastElevation = newElevation;
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
                // not time-critical, just add new path segments whenever you have a moment
                this.queueUpdate();
            }
        }
        this.#playing = false;
    }
}