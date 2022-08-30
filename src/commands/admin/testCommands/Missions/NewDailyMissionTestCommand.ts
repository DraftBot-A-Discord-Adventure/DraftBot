import {DailyMissions} from "../../../../core/database/game/models/DailyMission";
import {format} from "../../../../core/utils/StringFormatter";
import {DraftBotMissionsMessageBuilder} from "../../../../core/messages/DraftBotMissionsMessage";
import {Translations} from "../../../../core/Translations";
import {getTomorrowMidnight} from "../../../../core/utils/TimeUtils";
import PlayerMissionsInfo from "../../../../core/database/game/models/PlayerMissionsInfo";
import {Entities} from "../../../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Set the weapon of the player
 * @return {String} - The successful message formatted
 */
const newDailyMissionTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const entity = await Entities.getByDiscordUserId(interaction.user.id);
	const newDM = await DailyMissions.regenerateDailyMission();
	await PlayerMissionsInfo.update({
		dailyMissionNumberDone: 0,
		lastDailyMissionCompleted: new Date(entity.Player.PlayerMissionsInfo.lastDailyMissionCompleted.valueOf() - 86400000)
	}, {where: {}});
	return format(commandInfo.messageWhenExecuted, {
		mission: DraftBotMissionsMessageBuilder.getMissionDisplay(
			Translations.getModule("commands.missions", language),
			await newDM.Mission.formatDescription(newDM.objective, newDM.variant, language, null),
			getTomorrowMidnight(),
			0,
			newDM.objective
		)
	});
};

export const commandInfo: ITestCommand = {
	name: "newDailyMissions",
	aliases: ["ndm"],
	commandFormat: "",
	messageWhenExecuted: "La mission quotidienne a changée !\n Mission : {mission}",
	description: "Permet d'obtenir une nouvelle mission quotidienne",
	commandTestShouldReply: true,
	execute: newDailyMissionTestCommand
};