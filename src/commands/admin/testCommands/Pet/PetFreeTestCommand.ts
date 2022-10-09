import {Entities} from "../../../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {LogsDatabase} from "../../../../core/database/logs/LogsDatabase";

export const commandInfo: ITestCommand = {
	name: "petfree",
	aliases: ["pf"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez libéré votre pet de force !",
	description: "Libère votre pet de force, sans prendre en compte le cooldown",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Same as petfree command, but doesn't care about cooldown
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const petFreeTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (entity.Player.petId === null) {
		throw new Error("Erreur petfree : vous n'avez pas de pet !");
	}
	LogsDatabase.logPetFree(entity.Player.Pet).then();
	await entity.Player.Pet.destroy();
	entity.Player.petId = null;
	await entity.Player.save();
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = petFreeTestCommand;