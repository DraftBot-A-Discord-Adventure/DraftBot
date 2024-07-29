import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventGoToPVEIslandNotEnoughGemsPacket extends SmallEventPacket {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventGoToPVEIslandAcceptPacket extends SmallEventPacket {
	alone!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventGoToPVEIslandRefusePacket extends SmallEventPacket {

}