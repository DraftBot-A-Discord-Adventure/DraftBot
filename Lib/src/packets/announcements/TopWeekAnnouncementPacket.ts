import { AnnouncementPacket } from "./AnnouncementPacket";
import { TopWeekRewardedPlayersPerTier } from "../../constants/TopWeekRewardConstants";

export class TopWeekAnnouncementPacket extends AnnouncementPacket {
	winnerKeycloakId?: string;

	rewardedPlayersPerTier!: TopWeekRewardedPlayersPerTier;
}
