import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {BaseMission} from "../../interfaces/CompletedMission";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class MissionsExpiredPacket extends DraftBotPacket {
	keycloakId!: string;

	missions!: BaseMission[];
}