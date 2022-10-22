import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandsManager} from "../../../CommandsManager";
import {GuildDailyConstants} from "../../../../core/constants/GuildDailyConstants";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

let stringDesc = "Force un gd avec une sortie donnée. Liste des sorties possibles : ";
Object.entries(GuildDailyConstants.REWARD_TYPES).forEach((v) => stringDesc += `\n - ${v[1]}`); // eslint-disable-line no-return-assign

export const commandInfo: ITestCommand = {
	name: "guildreward",
	aliases: ["greward"],
	commandFormat: "<reward>",
	typeWaited: {
		reward: Constants.TEST_VAR_TYPES.STRING
	},
	messageWhenExecuted: "Reward {reward} forcé !",
	description: stringDesc,
	commandTestShouldReply: false,
	execute: null // defined later
};

/**
 * Force a gd with a given out
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildRewardTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {

	const [player] = await Players.getOrRegister(interaction.user.id);

	const guild = await Guild.findOne({where: {id: player.guildId}});
	if (guild === null) {
		throw new Error("Erreur greward : vous n'êtes pas dans une guilde !");
	}

	const rewardValues = Object.values(GuildDailyConstants.REWARD_TYPES);
	if (!rewardValues.includes(args[0])) {
		throw new Error("Erreur greward : reward donné n'existe pas. Veuillez vous référer à la commande \"test help greward\" pour plus d'informations");
	}
	await CommandsManager.executeCommandWithParameters("guilddailybonus", interaction, language, player, args[0]);
	return format(commandInfo.messageWhenExecuted, {reward: args[0]});
};

commandInfo.execute = guildRewardTestCommand;