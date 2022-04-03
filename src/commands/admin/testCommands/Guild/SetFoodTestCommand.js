import {Entities} from "../../../../core/models/Entity";
import Guild from "../../../../core/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {getFoodIndexOf} from "../../../../core/utils/FoodUtils";
import {Constants} from "../../../../core/Constants";

module.exports.commandInfo = {
	name: "setfood",
	aliases: ["sf"],
	commandFormat: "<foodType> <amount>",
	typeWaited: {
		foodType: typeVariable.STRING,
		amount: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {amountOfFood} de {foodEdited}!",
	description: "Set le montant d'une ressource de nourriture de la guilde à un montant donné"
};

/**
 * Set le montant d'une ressource de nourriture de la guilde à un montant donné
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const setFoodTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur sf : vous n'êtes pas dans une guilde !");
	}
	if (getFoodIndexOf(args[0]) === -1) {
		throw new Error("Erreur sf : mauvaise nourriture entrée, nourritures autorisées : " + Constants.PET_FOOD_GUILD_SHOP.TYPE.toString());
	}
	guild.setDataValue(args[0], args[1]);
	await guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {amountOfFood: args[0], foodEdited: args[1]});
};

module.exports.execute = setFoodTestCommand;