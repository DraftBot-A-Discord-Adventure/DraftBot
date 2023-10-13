import {DraftBotPacket} from "./DraftBotPacket";

export function sendPacket(client: WebSocket, packet: DraftBotPacket | DraftBotPacket[]) {
    client.send(JSON.stringify(packet))
}