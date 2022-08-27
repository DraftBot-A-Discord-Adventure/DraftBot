import {Entities} from "../../../../core/database/game/models/Entity";
import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";

/**
 * Set your guild's experience to the given integer
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildXpTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur gxp : vous n'êtes pas dans une guilde !");
	}
	if (args[0] < 0) {
		throw new Error("Erreur gxp : expérience de guilde invalide. Interdit de mettre de l'expérience négative !");
	}
	if (args[0] > 3 * guild.getExperienceNeededToLevelUp()) {
		throw new Error("Erreur gxp : expérience donnée trop élevée : montant autorisé entre 0 et " + 3 * guild.getExperienceNeededToLevelUp());
	}
	if (guild.isAtMaxLevel()) {
		throw new Error("Erreur gxp : la guilde est déjà niveau max !");
	}
	await guild.addExperience(parseInt(args[0], 10), interaction.channel, language, NumberChangeReason.TEST);
	await guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {experience: args[0]});
};

module.exports.commandInfo = {
	name: "guildxp",
	aliases: ["gxp"],
	commandFormat: "<experience>",
	typeWaited: {
		experience: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre guilde a maintenant {experience} :star: !",
	description: "Mets l'expérience de votre guilde au niveau donné",
	commandTestShouldReply: true,
	execute: guildXpTestCommand
};