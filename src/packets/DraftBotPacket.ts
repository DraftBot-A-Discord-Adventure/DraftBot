export class DraftBotPacket {}

export interface PacketContext {
	discord?: {
		channel: string
	}
}


export function makePacket<T extends DraftBotPacket>(cls: {new(): T}, {...args}: T): T {
	// eslint-disable-next-line new-cap
	const instance = new cls();
	Object.assign(instance, args);
	return instance;
}