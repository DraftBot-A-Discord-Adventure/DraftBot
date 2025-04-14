import { AsyncLock } from "./AsyncLock";

export class LockManager {
	private locks: Map<number, AsyncLock> = new Map();

	getLock(id: number): AsyncLock {
		if (!this.locks.has(id)) {
			this.locks.set(id, new AsyncLock());
		}
		return this.locks.get(id)!;
	}
}
