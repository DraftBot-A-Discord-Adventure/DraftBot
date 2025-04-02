import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { commandInfo as setCampaignTestCommandInfo } from "./SetCampaignTestCommand";
import { PlayerMissionsInfos } from "../../../../core/database/game/models/PlayerMissionsInfo";
import { Campaign } from "../../../../core/missions/Campaign";

export const commandInfo: ITestCommand = {
	name: "resetCampaign",
	description: "Remets à 0 la campagne"
};

/**
 * Reset the campaign of the player
 */
const resetCampaignTestCommand: ExecuteTestCommandLike = async (player, _args, response, context) => {
	await setCampaignTestCommandInfo.execute(player, ["1"], response, context);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	missionsInfo.campaignBlob = Campaign.getDefaultCampaignBlob();
	await missionsInfo.save();
	return "Vous avez redémarré la campagne";
};

commandInfo.execute = resetCampaignTestCommand;
