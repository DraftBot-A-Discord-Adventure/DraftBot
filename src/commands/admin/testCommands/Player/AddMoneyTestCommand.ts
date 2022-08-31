import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "addmoney",
	commandFormat: "<money>",
	typeWaited: {
		money: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {money} :moneybag: !",
	description: "Ajoute la valeur donnée d'argent à votre joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Add money to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addMoneyTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	await entity.Player.addMoney(entity, parseInt(args[0], 10), interaction.channel, language, NumberChangeReason.TEST);
	await entity.Player.save();

	return format(commandInfo.messageWhenExecuted, {money: entity.Player.money});
};

commandInfo.execute = addMoneyTestCommand;