import { SmallEventPacket } from "./SmallEventPacket";
import {
	PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { BaseMission } from "../../types/CompletedMission";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventFindMissionPacket extends SmallEventPacket {
	mission!: BaseMission;
}
