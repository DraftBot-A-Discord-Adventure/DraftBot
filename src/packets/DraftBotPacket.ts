export interface DraftBotPacket extends PacketContext {}

export interface PacketContext {
    discord?: {
        channel: string
    }
}
