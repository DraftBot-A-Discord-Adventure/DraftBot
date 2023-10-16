import {DraftBotPacket, PacketContext} from "./DraftBotPacket";

export function sendPacket(client: WebSocket, packet: DraftBotPacket | DraftBotPacket[]) {
    client.send(JSON.stringify(packet))
}

export function sendPacketsToContext(context: PacketContext, packets: DraftBotPacket[]) {
    for (const packet of packets) {
        for (const prop in context) {
            packet[<keyof PacketContext> prop] = context[<keyof PacketContext> prop];
        }
    }

    // TODO send
}