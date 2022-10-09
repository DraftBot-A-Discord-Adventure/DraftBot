import {CommandInteraction} from "discord.js";
import {format} from "../../../../core/utils/StringFormatter";
import {Constants} from "../../../../core/Constants";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Data} from "../../../../core/Data";
import MissionSlot, {MissionSlots} from "../../../../core/database/game/models/MissionSlot";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "setCampaign",
	commandFormat: "<progression>",
	typeWaited: {
		"progression": Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant à l'étape {progression} de la campagne",
	description: "Vous mets à une certaine étape de la campagne",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const setCampaignTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionSlots = await MissionSlots.getOfPlayer(player.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	const progression = parseInt(args[0], 10);
	const [campaign] = missionSlots.filter(m => m.isCampaign());
	const campaignMission = Data.getModule("campaign").getObjectFromArray("missions", progression - 1) as unknown as MissionSlot;

	missionsInfo.campaignProgression = progression;
	campaign.missionId = campaignMission.missionId;
	campaign.missionObjective = campaignMission.missionObjective;
	campaign.missionVariant = campaignMission.missionVariant;
	campaign.numberDone = await MissionsController.getMissionInterface(campaign.missionId).initialNumberDone(player, campaign.missionVariant);
	campaign.xpToWin = campaignMission.xpToWin;
	campaign.gemsToWin = campaignMission.gemsToWin;
	campaign.moneyToWin = campaignMission.moneyToWin;
	campaign.saveBlob = null;
	await campaign.save();
	await missionsInfo.save();

	return format(commandInfo.messageWhenExecuted, {
		progression
	});
};

commandInfo.execute = setCampaignTestCommand;