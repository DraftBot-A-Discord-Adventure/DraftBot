export class AsyncLock {
	// Indicates if the lock is currently held
	private locked: boolean = false;

	// Queue of functions to call when the lock becomes available
	private waiting: (() => void)[] = [];

	/**
	 * Acquires the lock. If the lock is free, it resolves immediately.
	 * Otherwise, it waits until the lock is released.
	 *
	 * @returns A function that must be called to release the lock.
	 */
	acquire(): Promise<() => void> {
		return new Promise<() => void>(resolve => {
			// This function releases the lock and passes it to the next in line, if any
			const release = (): void => {
				const next = this.waiting.shift(); // Take the next waiting callback
				if (next) {
					// Give the lock to the next in line
					next();
				}
				else {
					// No one is waiting — free the lock
					this.locked = false;
				}
			};

			if (this.locked) {
				// Lock is currently taken, so queue this resolver
				this.waiting.push(() => resolve(release));
			}
			else {
				// Lock is free, take it and resolve immediately
				this.locked = true;
				resolve(release);
			}
		});
	}
}
