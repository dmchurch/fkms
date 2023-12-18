import { nextAnimationFrame, nextIdlePeriod } from "./helpers.js";


export class ScrollingBackdrop {
    /** @type {SVGSVGElement} */
    svg;

    /** @type {BackdropElement[]} */
    elements = [];

    speed = 0; // in units of vh (100vh is the height of the browser viewport) per millisecond

    #playing = false;
    get isPlaying() { return this.#playing; }

    get renderRegion() {
        const { x, y, width, height } = this.svg.viewBox.baseVal;
        return {
            x, y, width, height,
            left: x,
            right: x + width,
            top: y,
            bottom: y + height,
        };
    }

    /**
     * @param {SVGElement} element
     * @returns {ScrollingBackdrop}
     */
    static getBackdrop(element) {
        const svg = element?.ownerSVGElement;
        if ("backdrop" in svg && svg.backdrop instanceof ScrollingBackdrop) {
            return svg.backdrop;
        }
        return new ScrollingBackdrop(svg);
    }

    /**
     * @param {SVGSVGElement} svg The root `<svg>` element
     */
    constructor(svg) {
        if (!(svg instanceof SVGSVGElement)) {
            throw new TypeError(`Element ${svg} is not a <path> element!`);
        }
        this.svg = svg;

        // make backdrop a non-enumerable, readonly property of the svg element
        Object.defineProperty(svg, "backdrop", { value: this, configurable: true });
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

    async #animationLoop() {
        this.#playing = true;
        let lastFrame = await nextAnimationFrame();
        const viewBox = this.svg.viewBox.baseVal;
        while (this.speed) {
            const frameTime = await nextAnimationFrame();
            const delta = (frameTime - lastFrame) * this.speed;
            lastFrame = frameTime;
            viewBox.x += delta; // scroll by adjusting the position of the SVG's viewport onto its infinite canvas
            for (const element of this.elements) {
                if (viewBox.x + viewBox.width > element.renderMax) {
                    // not time-critical, just add new path segments whenever you have a moment
                    element.queueUpdate();
                }

            }
        }
        this.#playing = false;
    }
}

/**
 * Base class for any procedurally-drawn `<path>` elements in a scrolling SVG backdrop
 * @abstract
 */
export class BackdropElement {
    /** @type {SVGPathElement} */
    path;

    /** @type {ScrollingBackdrop} */
    backdrop;

    /** Leftmost currently-rendered point @type {number} */
    renderMin;
    /** Rightmost currently-rendered point @type {number} */
    renderMax;

    /** Intended lowest (most-positive) point along the path @type {number} */
    elevationMin;
    /** Intended highest (most-negative) point along the path @type {number} */
    elevationMax;
    /** The y value of the long flat part of the path @type {number} */
    elevationBase;
    /** The y value the cursor should start at, at x = {@link renderMin} @type {number} */
    elevationStart;

    /** An array of `<path>` command strings, to be concatenated with spaces between @type {string[]} */
    pathSegments = [];

    get pathStart() {
        // To start: move the cursor to the left side of the render window at starting elevation
        return `M ${this.renderMin},${this.elevationStart}`;
    }
    get pathEnd() {
        // Drop a vertical to base elevation, horizontal back to left side of render window, then close the path
        return `V ${this.elevationBase} H ${this.renderMin} Z`;
    }

    #updateQueued = false;

    /**
     * @param {string} pathId ID of the <path> SVG element
     * @param {Partial<BackdropElement>} [options] Properties to assign on this object
     */
    constructor(pathId, options = {}) {
        if (this.constructor === BackdropElement) {
            throw new TypeError(`Do not instantiate BackdropElement directly!`)
        }
        const element = document.getElementById(pathId);
        if (!(element instanceof SVGPathElement)) {
            throw new TypeError(`Element ${pathId} is not a <path> element!`);
        }

        this.path = element;
        this.backdrop = ScrollingBackdrop.getBackdrop(element);
        this.backdrop.elements.push(this);

        // set sensible defaults based on the render region
        const currentRegion = this.backdrop.renderRegion;
        this.renderMin = this.renderMax = currentRegion.left;
        this.elevationMin = currentRegion.bottom;
        this.elevationMax = currentRegion.top;
        this.elevationBase = currentRegion.bottom;

        // set overrides from passed-in options
        Object.assign(this, options);

        // if elevationStart hasn't been assigned yet (from options), assign it a random valid elevation
        this.elevationStart ??= this.randomElevation();

        // queue an update, but don't take more than 100ms
        this.queueUpdate({ timeout: 100 });
    }

    /**
     * Start scrolling this backdrop and/or update the current scroll speed.
     *
     * This is a convenience shortcut for {@link ScrollingBackdrop.play}.
     *
     * @param {number} speed The speed to scroll the backdrop at, must be > 0
     */
    play(speed) { this.backdrop.play(speed); }

    /**
     * Stop scrolling the backdrop.
     *
     * This is a convenience shortcut for {@link ScrollingBackdrop.stop}.
     */
    stop() { this.backdrop.stop(); }

    /**
     * Return the y-value of a random elevation in this element's elevation range.
     *
     * @returns {number} The elevation value (should be negative)
     */
    randomElevation() {
        return Math.random() * (this.elevationMax - this.elevationMin) + this.elevationMin;
    }

    /**
     * Update the current path so that it extends past the right side of the SVG viewport, and prune any path elements
     * that are now scrolled past the left of the viewport.
     *
     * @param {IdleDeadline} [deadline] Optional deadline to restrict processing time
     */
    async update(deadline) {
        const { renderRegion } = this.backdrop;

        // Add segments until we've rendered past the right edge of the viewport
        while (this.renderMax < renderRegion.right) {
            this.addNextPathSegment();
            // if we have a deadline object and it reports no time remaining, wait for the next idle period before continuing.
            if (deadline && deadline.timeRemaining() <= 0) {
                deadline = await nextIdlePeriod(deadline.didTimeout ? { timeout: 1 } : {}); // if this execution was the result of a timeout, continue setting timeouts until we finish
            }
        }

        let nextRenderMin = this.getNextRenderMin();
        // Remove segments as long as we can do so and not cut into the left edge of the viewport
        while (this.pathSegments.length > 0 && nextRenderMin < renderRegion.left) {
            this.removeFirstPathSegment();
            if (!Number.isFinite(nextRenderMin - this.renderMin) || (nextRenderMin !== this.renderMin && Math.abs(nextRenderMin - this.renderMin) > 0.0001)) {
                // probably a programming slip, be detailed
                console.warn(`Class ${this.constructor?.name} returned ${nextRenderMin} from getNextRenderMin() but renderMin is to ${this.renderMin} after removeFirstPathSegment()!`, this, this.constructor, nextRenderMin, this.renderMin);
            }
            nextRenderMin = this.getNextRenderMin();
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
            requestIdleCallback(this.update.bind(this), options);
        }
    }

    /**
     * Function defined by a {@link BackdropElement} subclass that returns the value that {@link renderMin} will get
     * set to after the next call to {@link removeFirstPathSegment}.
     *
     * this.{@link pathSegments}[] is guaranteed to have at least 1 element when this is called.
     *
     * @protected
     * @returns {number}
     */
    getNextRenderMin() {
        throw new Error(`getNextRenderMin not implemented in class ${this.constructor?.name}`);
    }

    /**
     * Function defined by a {@link BackdropElement} subclass that prunes the leftmost part of the path. This should
     * modify {@link renderMin} and {@link elevationStart} to reflect the new starting position for the cursor,
     * in addition to removing the first element (or potentially elements) of {@link pathSegments}.
     *
     * this.{@link pathSegments}[] is guaranteed to have at least 1 element when this is called.
     *
     * @protected
     */
    removeFirstPathSegment() {
        throw new Error(`removeFirstPathSegment not implemented in class ${this.constructor?.name}`);
    }

    /**
     * Function defined by a {@link BackdropElement} subclass that adds to the end of the path. This should
     * modify {@link renderMax} to reflect the new rightmost rendered position, in addition to adding an element
     * (or potentially elements) to the end of {@link pathSegments}.
     *
     * @protected
     */
    addNextPathSegment() {
        throw new Error(`addNextPathSegment not implemented in class ${this.constructor?.name}`);
    }
}

