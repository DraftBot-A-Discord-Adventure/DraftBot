import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";

module.exports.commandInfo = {
	name: "playersuicide",
	aliases: ["suicide"],
	commandFormat: "",
	messageWhenExecuted: "Vous vous êtes suicidé avec succès !",
	description: "Vous permet de vous suicider dans le plus grand des calmes",
	commandTestShouldReply: true
};

/**
 * Kill yourself
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const playerSuicideTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	await entity.addHealth(-entity.health, interaction.channel, language, NumberChangeReason.TEST, {
		overHealCountsForMission: true,
		shouldPokeMission: true
	});
	await entity.Player.killIfNeeded(entity, interaction.channel, language);
	await Promise.all([entity.save(), entity.Player.save()]);

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = playerSuicideTestCommand;