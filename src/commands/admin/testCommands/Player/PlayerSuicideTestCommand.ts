import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "playersuicide",
	aliases: ["suicide"],
	commandFormat: "",
	messageWhenExecuted: "Vous vous êtes suicidé avec succès !",
	description: "Vous permet de vous suicider dans le plus grand des calmes",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Kill yourself
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const playerSuicideTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	await entity.addHealth(-entity.health, interaction.channel, language, NumberChangeReason.TEST, {
		overHealCountsForMission: true,
		shouldPokeMission: true
	});
	await entity.Player.killIfNeeded(entity, interaction.channel, language, NumberChangeReason.TEST);
	await Promise.all([entity.save(), entity.Player.save()]);

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = playerSuicideTestCommand;
