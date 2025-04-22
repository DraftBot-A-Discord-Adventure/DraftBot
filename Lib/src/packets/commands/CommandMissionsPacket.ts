import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { BaseMission } from "../../types/CompletedMission";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandMissionsPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number;
		keycloakId?: string;
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionsPacketRes extends DraftBotPacket {
	keycloakId!: string;

	missions!: BaseMission[];

	campaignProgression!: number;

	maxCampaignNumber!: number;

	maxSideMissionSlots!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionPlayerNotFoundPacket extends DraftBotPacket {}
