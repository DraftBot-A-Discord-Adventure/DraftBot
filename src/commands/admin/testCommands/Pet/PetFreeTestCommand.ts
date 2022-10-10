import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {LogsDatabase} from "../../../../core/database/logs/LogsDatabase";
import {Players} from "../../../../core/database/game/models/Player";
import {PetEntities} from "../../../../core/database/game/models/PetEntity";

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
	const [player] = await Players.getOrRegister(interaction.user.id);
	if (player.petId === null) {
		throw new Error("Erreur petfree : vous n'avez pas de pet !");
	}
	const playerPet = await PetEntities.getById(player.petId);
	LogsDatabase.logPetFree(playerPet).then();
	await playerPet.destroy();
	player.petId = null;
	await player.save();
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = petFreeTestCommand;