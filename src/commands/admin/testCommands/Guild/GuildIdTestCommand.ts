import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {LanguageType} from "../../../../core/constants/TypeConstants";

export const commandInfo: ITestCommand = {
	name: "guildid",
	aliases: ["gid", "mygid"],
	commandFormat: "",
	messageWhenExecuted: "Votre guilde ({gName}) possède l'id n°{idGuild} !",
	description: "Renvoie l'id de votre guilde",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Get your guild's id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const guildIdTestCommand = async (language: LanguageType, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: player.guildId}});
	if (guild === null) {
		throw new Error("Erreur mygid : vous n'êtes pas dans une guilde !");
	}
	return format(commandInfo.messageWhenExecuted, {gName: guild.name, idGuild: guild.id});
};

commandInfo.execute = guildIdTestCommand;