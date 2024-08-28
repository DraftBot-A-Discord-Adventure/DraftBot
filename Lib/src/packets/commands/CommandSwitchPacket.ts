import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandSwitchPacketReq extends DraftBotPacket {
	keycloakId!: string;
}