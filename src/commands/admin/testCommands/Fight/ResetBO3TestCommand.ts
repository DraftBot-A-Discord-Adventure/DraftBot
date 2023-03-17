import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {Constants} from "../../../../core/Constants";
import {getIdFromMention} from "../../../../core/utils/StringUtils";
import {LogsFightsResults} from "../../../../core/database/logs/models/LogsFightsResults";
import {HasOne, Op} from "sequelize";
import {getNextSaturdayMidnight} from "../../../../core/utils/TimeUtils";
import {LogsPlayers} from "../../../../core/database/logs/models/LogsPlayers";

export const commandInfo: ITestCommand = {
	name: "resetbo3",
	commandFormat: "<mention>",
	typeWaited: {
		discordId: Constants.TEST_VAR_TYPES.MENTION
	},
	messageWhenExecuted: "Reset du BO3 contre {player}",
	description: "Reset le BO3 contre un joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Reset the BO3 against a player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const bo3TestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(getIdFromMention(args[0]));

	const fightsBO3 = await LogsFightsResults.findAll({
		where: {
			[Op.or]: [
				{
					"$LogsPlayer1.discordId$": interaction.user.id,
					"$LogsPlayer2.discordId$": player.discordUserId
				},
				{
					"$LogsPlayer1.discordId$": player.discordUserId,
					"$LogsPlayer2.discordId$": interaction.user.id
				}
			],
			date: {
				[Op.gt]: Math.floor((getNextSaturdayMidnight() - 7 * 24 * 60 * 60 * 1000) / 1000)
			},
			friendly: false
		},
		include: [{
			model: LogsPlayers,
			association: new HasOne(LogsFightsResults, LogsPlayers, {
				sourceKey: "player1Id",
				foreignKey: "id",
				as: "LogsPlayer1"
			})
		}, {
			model: LogsPlayers,
			association: new HasOne(LogsFightsResults, LogsPlayers, {
				sourceKey: "player2Id",
				foreignKey: "id",
				as: "LogsPlayer2"
			})
		}]
	});

	for (const fightBO3 of fightsBO3) {
		await fightBO3.destroy();
	}

	return format(commandInfo.messageWhenExecuted, {player: args[0]});
};

commandInfo.execute = bo3TestCommand;