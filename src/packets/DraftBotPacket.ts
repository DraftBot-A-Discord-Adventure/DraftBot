export interface DraftBotPacket extends PacketContext {}

export interface PacketContext {
    discord?: {
        channel: string
    }
}


export function makePacket<T extends DraftBotPacket>(packet: T): T {
	return packet;
}