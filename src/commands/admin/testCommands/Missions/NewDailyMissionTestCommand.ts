import {DailyMissions} from "../../../../core/database/game/models/DailyMission";
import {format} from "../../../../core/utils/StringFormatter";
import {DraftBotMissionsMessageBuilder} from "../../../../core/messages/DraftBotMissionsMessage";
import {Translations} from "../../../../core/Translations";
import {getTomorrowMidnight} from "../../../../core/utils/TimeUtils";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Missions} from "../../../../core/database/game/models/Mission";
import PlayerMissionsInfo from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "newDailyMissions",
	aliases: ["ndm"],
	commandFormat: "",
	messageWhenExecuted: "La mission quotidienne a été changée !\n Mission : {mission}",
	description: "Permet d'obtenir une nouvelle mission quotidienne",
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * Set the weapon of the player
 * @return {String} - The successful message formatted
 */
const newDailyMissionTestCommand = async (language: string): Promise<string> => {
	const newDM = await DailyMissions.regenerateDailyMission();
	await PlayerMissionsInfo.update({
		dailyMissionNumberDone: 0,
		lastDailyMissionCompleted: new Date(0)
	}, {where: {}});
	return format(commandInfo.messageWhenExecuted, {
		mission: DraftBotMissionsMessageBuilder.getMissionDisplay(
			Translations.getModule("commands.missions", language),
			await (await Missions.getById(newDM.missionId)).formatDescription(newDM.objective, newDM.variant, language, null),
			getTomorrowMidnight(),
			0,
			newDM.objective
		)
	});
};

commandInfo.execute = newDailyMissionTestCommand;