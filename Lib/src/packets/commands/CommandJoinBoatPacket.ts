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

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatNoGuildPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatTooManyRunsPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatNoMemberOnBoatPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatNotEnoughEnergyPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandJoinBoatNotEnoughGemsPacketRes extends DraftBotPacket {
}
