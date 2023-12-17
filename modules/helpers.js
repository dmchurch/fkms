

/**
 * Returns a promise that will resolve after a certain number of milliseconds.
 * 
 * @param {number} seconds Number of seconds to delay
 * 
 * @example
 * 
 * await delaySeconds(0.1);
 */
export async function delaySeconds(seconds) {
    await delayMilliseconds(seconds * 1000);
}

/**
 * Returns a promise that will resolve after a certain number of milliseconds.
 * 
 * @param {number} ms Number of milliseconds to delay
 * 
 * @example
 * 
 * await delayMilliseconds(100);
 */
export async function delayMilliseconds(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns a promise that will resolve when the next frame is ready to be displayed onscreen.
 * 
 * @returns {Promise<DOMHighResTimeStamp>}
 * 
 * @example
 * 
 * ```
 * while (true) {
 *     const frameTime = await nextAnimationFrame();
 *     // Perform frame-update-code, using frameTime as the timestamp
 * }
 * ```
 */
export async function nextAnimationFrame() {
    return await new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Returns a promise that will resolve when the browser next has an idle period.
 * 
 * @param {IdleRequestOptions} [options] Options to pass to {@link requestIdleCallback}
 * @returns {Promise<IdleDeadline>}
 * 
 * @example
 * 
 * ```
 * while (true) {
 *     const deadline = await nextIdlePeriod();
 *     while (deadline.timeRemaining() > 0) {
 *         // Perform any code you like, just try not to take too long in each loop
 *     }
 * }
 * ```
 */
export async function nextIdlePeriod(options) {
    return await new Promise(resolve => requestIdleCallback(resolve, options));
}