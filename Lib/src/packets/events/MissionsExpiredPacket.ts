import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { BaseMission } from "../../types/CompletedMission";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class MissionsExpiredPacket extends DraftBotPacket {
	keycloakId!: string;

	missions!: BaseMission[];
}
