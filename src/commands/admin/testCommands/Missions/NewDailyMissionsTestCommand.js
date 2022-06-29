import {DailyMissions} from "../../../../core/models/DailyMission";
import {format} from "../../../../core/utils/StringFormatter";
import {DraftBotMissionsMessageBuilder} from "../../../../core/messages/DraftBotMissionsMessage";
import {Translations} from "../../../../core/Translations";
import {getTomorrowMidnight} from "../../../../core/utils/TimeUtils";
import PlayerMissionsInfo from "../../../../core/models/PlayerMissionsInfo";
import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "newDailyMissions",
	aliases: ["ndm"],
	commandFormat: "",
	messageWhenExecuted: "La mission quotidienne a changée !\n Mission : {mission}",
	description: "Permet d'obtenir une nouvelle mission quotidienne",
	commandTestShouldReply: true
};

/**
 * Set the weapon of the player
 * @return {String} - The successful message formatted
 */
const clearMissionsTestCommand = async (language, interaction) => {
	const e = await Entities.getByDiscordUserId(interaction.user.id);
	const newDM = await DailyMissions.regenerateDailyMission();
	await PlayerMissionsInfo.update({
		dailyMissionNumberDone: 0,
		lastDailyMissionCompleted: new Date(e.Player.PlayerMissionsInfo.lastDailyMissionCompleted.valueOf() - 86400000)
	}, {where: {}});
	return format(module.exports.commandInfo.messageWhenExecuted, {
		mission: DraftBotMissionsMessageBuilder.getMissionDisplay(
			Translations.getModule("commands.missions", language),
			await newDM.Mission.formatDescription(newDM.objective, newDM.variant, language, null),
			getTomorrowMidnight(),
			0,
			newDM.objective
		)
	});
};

module.exports.execute = clearMissionsTestCommand;