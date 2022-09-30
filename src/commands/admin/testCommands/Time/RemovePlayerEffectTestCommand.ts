import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {TravelTime} from "../../../../core/maps/TravelTime";

export const commandInfo: ITestCommand = {
	name: "removeplayereffect",
	aliases: ["rmeffect"],
	commandFormat: "",
	messageWhenExecuted: "Vous n'avez plus d'effets !",
	description: "Enlève votre effet actuel",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Remove the effect of your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const removePlayerEffectTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	await TravelTime.removeEffect(entity.Player, NumberChangeReason.TEST);
	await entity.Player.save();

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = removePlayerEffectTestCommand;