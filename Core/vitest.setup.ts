import { vi } from 'vitest';

vi.mock('mqtt', () => ({
	connect: () => ({
		on: () => {},
		subscribe: (topic: string, cb: (err?: any) => void) => cb?.(),
	}),
}));

vi.mock('./src/core/bot/DraftBot', () => {
	return {
		DraftBot: class {
			init = () => Promise.resolve();
			packetListener = { getListener: () => null };
			logsDatabase = { logTimeWarp: () => Promise.resolve(), logAlteration: () => Promise.resolve() };
		}
	};
});
