import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {CompletedMission} from "../../interfaces/CompletedMission";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class MissionsCompletedPacket extends DraftBotPacket {
	keycloakId!: string;

	missions!: CompletedMission[];
}