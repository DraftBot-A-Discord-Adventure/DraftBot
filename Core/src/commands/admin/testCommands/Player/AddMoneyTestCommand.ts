import { NumberChangeReason } from "../../../../../../Lib/src/constants/LogsConstants";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "addmoney",
	commandFormat: "<money>",
	typeWaited: {
		money: TypeKey.INTEGER
	},
	description: "Ajoute la valeur donnée d'argent à votre joueur"
};

/**
 * Add money to the player
 */
const addMoneyTestCommand: ExecuteTestCommandLike = async (player, args, response) => {
	await player.addMoney({
		amount: parseInt(args[0], 10),
		response,
		reason: NumberChangeReason.TEST
	});
	await player.save();

	return `Vous avez maintenant ${player.money} :moneybag: !`;
};

commandInfo.execute = addMoneyTestCommand;
