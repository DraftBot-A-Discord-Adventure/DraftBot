import {Maps} from "../../../../core/maps/Maps";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "travelreport",
	aliases: ["tr"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez réinitialisé votre parcours !",
	description: "Réinitialise le parcours que vous effectuez",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Reset your current travel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const travelReportTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);

	if (!Maps.isTravelling(player)) {
		throw new Error("Erreur travelreport : vous ne voyagez pas actuellement !");
	}

	player.startTravelDate = new Date();
	player.effectEndDate = new Date(0);
	await player.save();

	return commandInfo.messageWhenExecuted;

};

commandInfo.execute = travelReportTestCommand;