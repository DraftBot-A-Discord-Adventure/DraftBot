import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {getFoodIndexOf} from "../../../../core/utils/FoodUtils";
import {Constants} from "../../../../core/Constants";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "setfood",
	aliases: ["sf"],
	commandFormat: "<foodType> <amount>",
	typeWaited: {
		foodType: Constants.TEST_VAR_TYPES.STRING,
		amount: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {amountOfFood} de {foodEdited}!",
	description: "Set le montant d'une ressource de nourriture de la guilde à un montant donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set le montant d'une ressource de nourriture de la guilde à un montant donné
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const setFoodTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: player.guildId}});
	if (guild === null) {
		throw new Error("Erreur sf : vous n'êtes pas dans une guilde !");
	}
	if (getFoodIndexOf(args[0]) === -1) {
		throw new Error("Erreur sf : mauvaise nourriture entrée, nourritures autorisées : " + Constants.PET_FOOD_GUILD_SHOP.TYPE.toString());
	}
	guild.setDataValue(args[0], args[1]);
	await guild.save();
	return format(commandInfo.messageWhenExecuted, {amountOfFood: args[0], foodEdited: args[1]});
};

commandInfo.execute = setFoodTestCommand;