import {DailyMissions} from "../../../../core/database/game/models/DailyMission";
import {format} from "../../../../core/utils/StringFormatter";
import {DraftBotMissionsMessageBuilder} from "../../../../core/messages/DraftBotMissionsMessage";
import {Translations} from "../../../../core/Translations";
import {getTomorrowMidnight} from "../../../../core/utils/TimeUtils";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "newDailyMissions",
	aliases: ["ndm"],
	commandFormat: "",
	messageWhenExecuted: "La mission quotidienne a changée !\n Mission : {mission}",
	description: "Permet d'obtenir une nouvelle mission quotidienne",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @return {String} - The successful message formatted
 */
const newDailyMissionTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const player = await Players.getByDiscordUserId(interaction.user.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	const newDM = await DailyMissions.regenerateDailyMission();
	await PlayerMissionsInfo.update({
		dailyMissionNumberDone: 0,
		lastDailyMissionCompleted: new Date(missionsInfo.lastDailyMissionCompleted.valueOf() - 86400000)
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

commandInfo.execute = newDailyMissionTestCommand;