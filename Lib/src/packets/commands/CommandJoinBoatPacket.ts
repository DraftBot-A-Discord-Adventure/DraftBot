import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandJoinBoatPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatAcceptPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatRefusePacketRes extends DraftBotPacket {
}