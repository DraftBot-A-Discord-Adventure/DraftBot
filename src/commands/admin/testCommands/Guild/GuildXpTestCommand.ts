import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "guildxp",
	aliases: ["gxp"],
	commandFormat: "<experience>",
	typeWaited: {
		experience: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Votre guilde a maintenant {experience} :star: !",
	description: "Mets l'expérience de votre guilde au niveau donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set your guild's experience to the given integer
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildXpTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: player.guildId}});
	if (guild === null) {
		throw new Error("Erreur gxp : vous n'êtes pas dans une guilde !");
	}
	const xp = parseInt(args[0], 10);
	if (xp < 0) {
		throw new Error("Erreur gxp : expérience de guilde invalide. Interdit de mettre de l'expérience négative !");
	}
	if (xp > 3 * guild.getExperienceNeededToLevelUp()) {
		throw new Error("Erreur gxp : expérience donnée trop élevée : montant autorisé entre 0 et " + 3 * guild.getExperienceNeededToLevelUp());
	}
	if (guild.isAtMaxLevel()) {
		throw new Error("Erreur gxp : la guilde est déjà niveau max !");
	}
	await guild.addExperience(xp, interaction.channel, language, NumberChangeReason.TEST);
	await guild.save();
	return format(commandInfo.messageWhenExecuted, {experience: args[0]});
};

commandInfo.execute = guildXpTestCommand;