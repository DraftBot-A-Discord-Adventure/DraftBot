export class DraftBotPacket {}

export interface PacketContext {
	discord?: {
		interaction: string,
		channel: string
	}
}


export function makePacket<Packet extends DraftBotPacket>(Packet: {new(): Packet}, {...args}: Packet): Packet {
	const instance = new Packet();
	Object.assign(instance, args);
	return instance;
}