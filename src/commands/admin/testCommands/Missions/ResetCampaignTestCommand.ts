import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {commandInfo as sctcCommandInfo} from "./SetCampaignTestCommand";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";
import {Campaign} from "../../../../core/missions/Campaign";

export const commandInfo: ITestCommand = {
	name: "resetCampaign",
	commandFormat: "",
	typeWaited: {},
	messageWhenExecuted: "Vous avez redémarré la campagne",
	description: "Remets à 0 la campagne",
	commandTestShouldReply: true,
	execute: null // Defined later
};

const resetCampaignTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	await sctcCommandInfo.execute(language, interaction, ["1"]);
	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	missionsInfo.campaignBlob = Campaign.getDefaultCampaignBlob();
	await missionsInfo.save();
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = resetCampaignTestCommand;