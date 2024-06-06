import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventGoToPVEIslandNotEnoughGemsPacket extends SmallEventPacket {

}

export class SmallEventGoToPVEIslandAcceptPacket extends SmallEventPacket {
	alone!: boolean;
}

export class SmallEventGoToPVEIslandRefusePacket extends SmallEventPacket {

}