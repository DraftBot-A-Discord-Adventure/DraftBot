import {Entities} from "../../../../core/database/game/models/Entity";
import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Get your guild's id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const guildIdTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur mygid : vous n'êtes pas dans une guilde !");
	}
	return format(commandInfo.messageWhenExecuted, {gName: guild.name, idGuild: guild.id});
};

export const commandInfo: ITestCommand = {
	name: "guildid",
	aliases: ["gid", "mygid"],
	commandFormat: "",
	messageWhenExecuted: "Votre guilde ({gName}) possède l'id n°{idGuild} !",
	description: "Renvoie l'id de votre guilde",
	commandTestShouldReply: true,
	execute: guildIdTestCommand
};