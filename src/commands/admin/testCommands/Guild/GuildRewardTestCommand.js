import {Entities} from "../../../../core/models/Entity";
import Guild from "../../../../core/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandsManager} from "../../../CommandsManager";
import {Constants} from "../../../../core/Constants";

let stringDesc = "Force un gd avec une sortie donnée. Liste des sorties possibles : ";
Object.entries(Constants.REWARD_TYPES).forEach((v) => stringDesc += "\n - " + v[1]); // eslint-disable-line no-return-assign
module.exports.commandInfo = {
	name: "guildreward",
	aliases: ["greward"],
	commandFormat: "<reward>",
	typeWaited: {
		reward: typeVariable.STRING
	},
	messageWhenExecuted: "Reward {reward} forcé !",
	description: stringDesc
};

/**
 * Force a gd with a given out
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildRewardTestCommand = async (language, interaction, args) => {

	const [entity] = await Entities.getOrRegister(interaction.user.id);

	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur greward : vous n'êtes pas dans une guilde !");
	}

	const rewardValues = Object.keys(Constants.REWARD_TYPES).map(function(key) {
		return Constants.REWARD_TYPES[key];
	});
	if (!rewardValues.includes(args[0])) {
		throw new Error("Erreur greward : reward donné n'existe pas. Veuillez vous référer à la commande \"test help greward\" pour plus d'informations");
	}
	await CommandsManager.executeCommandWithParameters("guilddaily", interaction, language, entity, args[0]);
	return format(module.exports.commandInfo.messageWhenExecuted, {reward: args[0]});
};

module.exports.execute = guildRewardTestCommand;