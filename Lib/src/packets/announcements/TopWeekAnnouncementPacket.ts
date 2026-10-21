import { AnnouncementPacket } from "./AnnouncementPacket";
import { KingChallengeWeekSummary } from "../../types/KingChallenge";

export class TopWeekAnnouncementPacket extends AnnouncementPacket {
	winnerKeycloakId?: string;

	kingChallenge!: KingChallengeWeekSummary;
}
