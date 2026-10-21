import { AnnouncementPacket } from "./AnnouncementPacket";
import { TopWeekRewardedPlayersPerLeague } from "../../constants/TopWeekRewardConstants";

export class TopWeekAnnouncementPacket extends AnnouncementPacket {
	winnerKeycloakId?: string;

	rewardedPlayersPerLeague!: TopWeekRewardedPlayersPerLeague;
}
