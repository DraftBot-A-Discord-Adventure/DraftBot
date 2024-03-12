export class DraftBotPacket {}

export interface PacketContext {
	keycloakId?: string;

	discord?: {
		user: string,
		interaction: string,
		buttonInteraction?: string,
		channel: string,
		language: string
	}
}


export function makePacket<Packet extends DraftBotPacket>(Packet: {new(): Packet}, {...args}: Packet): Packet {
	const instance = new Packet();
	Object.assign(instance, args);
	return instance;
}