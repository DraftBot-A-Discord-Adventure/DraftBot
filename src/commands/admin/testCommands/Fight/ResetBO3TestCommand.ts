import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {LogsFightsResults} from "../../../../core/database/logs/models/LogsFightsResults";
import {HasOne, Op} from "sequelize";
import {getNextSaturdayMidnight} from "../../../../core/utils/TimeUtils";
import {LogsPlayers} from "../../../../core/database/logs/models/LogsPlayers";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "resetbo3",
	commandFormat: "<mention>",
	typeWaited: {
		discordId: TypeKey.MENTION
	},
	description: "Reset le BO3 contre un joueur"
};

/**
 * Reset the BO3 against a player
 */
const bo3TestCommand: ExecuteTestCommandLike = async (player, args) => {
	// TODO : edit this when ids will be used instead of discord ids
	const otherPlayer = await Players.getByDiscordUserId(args[0].replace("<@!", "").replace(">", ""));
	const fightsBO3 = await LogsFightsResults.findAll({
		where: {
			[Op.or]: [
				{
					"$LogsPlayer1.discordId$": otherPlayer.discordUserId,
					"$LogsPlayer2.discordId$": player.discordUserId
				},
				{
					"$LogsPlayer1.discordId$": player.discordUserId,
					"$LogsPlayer2.discordId$": otherPlayer.discordUserId
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

	return `Reset du BO3 contre ${args[0]}`;
};

commandInfo.execute = bo3TestCommand;