import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "playermoney",
	aliases: ["money"],
	commandFormat: "<money>",
	typeWaited: {
		money: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {money} :moneybag: !",
	description: "Mets l'argent votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the money of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerMoneyTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const money = parseInt(args[0], 10);
	if (money < 0) {
		throw new Error("Erreur money : argent donné inférieur à 0 interdit !");
	}
	await player.addMoney({
		amount: money - player.money,
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.TEST
	});
	await player.save();

	return format(commandInfo.messageWhenExecuted, {money: player.money});
};

commandInfo.execute = playerMoneyTestCommand;