import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";
import {BaseMission} from "../../interfaces/CompletedMission";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventFindMissionPacket extends SmallEventPacket {
	mission!: BaseMission;
}