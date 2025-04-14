import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.NONE)
export class SmallEventPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.NONE)
export class SmallEventAddSomething extends SmallEventPacket {
	amount!: number;
}
