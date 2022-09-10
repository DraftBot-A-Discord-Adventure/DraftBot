import {Entities} from "../../../../core/database/game/models/Entity";
import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "guildlevel",
	aliases: ["glvl"],
	commandFormat: "<level>",
	typeWaited: {
		level: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Votre guilde est maintenant niveau {level} !",
	description: "Mets le niveau de votre guilde au niveau donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set your guild's level to the given integer
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildLevelTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur glvl : vous n'êtes pas dans une guilde !");
	}
	const guildLvl = parseInt(args[0], 10);
	if (guildLvl <= 0 || guildLvl > 100) {
		throw new Error("Erreur glvl : niveau de guilde invalide ! Fourchette de niveau compris entre 0 et 100.");
	}
	guild.level = guildLvl;
	await guild.save();
	return format(commandInfo.messageWhenExecuted, {level: args[0]});
};

commandInfo.execute = guildLevelTestCommand;