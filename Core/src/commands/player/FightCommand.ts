import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "../../core/database/game/models/Player";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {ReactionCollectorFight} from "../../../../Lib/src/packets/interaction/ReactionCollectorFight";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	CommandFightPacketReq,
	CommandFightRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandFightPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {LogsReadRequests, RankedFightResult} from "../../core/database/logs/LogsReadRequests";

type PlayerStats = {
	classId: number,
	fightRanking: {
		glory: number,
	}
	energy: {
		value: number,
		max: number
	},
	attack: number,
	defense: number,
	speed: number
	breath: {
		base: number,
		max: number,
		regen: number
	}
}

async function getPlayerStats(player: Player): Promise<PlayerStats> {
	const playerActiveObjects = await InventorySlots.getMainSlotsItems(player.id);
	return {
		classId: player.class,
		fightRanking: {
			glory: player.getGloryPoints()
		},
		energy: {
			value: player.getCumulativeFightPoint(),
			max: player.getMaxCumulativeFightPoint()
		},
		attack: player.getCumulativeAttack(playerActiveObjects),
		defense: player.getCumulativeDefense(playerActiveObjects),
		speed: player.getCumulativeSpeed(playerActiveObjects),
		breath: {
			base: player.getBaseBreath(),
			max: player.getMaxBreath(),
			regen: player.getBreathRegen()
		}
	};
}

/**
 * Check if a BO3 is already finished (3 games played or 2 wins)
 * @param bo3
 */
function bo3isAlreadyFinished(bo3: RankedFightResult) {
	return bo3.won > 1 || bo3.lost > 1 || bo3.draw + bo3.won + bo3.lost >= 3;
}

/**
 * Find another player to fight the player that started the command
 * @param player - player that wants to fight
 * @returns player opponent
 */
async function findOpponent(player: Player): Promise<Player | null> {
	for (let offset = 0; offset <= FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH; offset++) {
		// Retrieve some potential opponents
		const validOpponents = await Players.findPotentialOpponent(
			player,
			FightConstants.PLAYER_PER_OPPONENT_SEARCH,
			offset
		);
		if (validOpponents.length === 0) {
			continue;
		}

		// Shuffle the array of opponents to randomize who gets picked first
		validOpponents.sort(() => Math.random() - 0.5);

		// Check if these players have been defenders recently
		const haveBeenDefenderRecently = await LogsReadRequests.hasBeenADefenderInRankedFightSinceMinute(
			validOpponents.map((opponent) => opponent.keycloakId),
			FightConstants.DEFENDER_COOLDOWN_MINUTES
		);
		// Filter out opponents who have been defenders too recently
		const opponentsNotOnCooldown = validOpponents.filter(
			(opponent) => !haveBeenDefenderRecently[opponent.keycloakId]
		);
		// If nobody is off cooldown in this batch, continue to the next offset
		if (opponentsNotOnCooldown.length === 0) {
			continue;
		}

		// Get IDs for the remaining opponents
		const remainingOpponentKeycloakIds = opponentsNotOnCooldown.map(
			(opponent) => opponent.keycloakId
		);
		// Fetch the fight results against all remaining valid opponents
		const bo3Map = await LogsReadRequests.getRankedFightsThisWeek(
			player.keycloakId,
			remainingOpponentKeycloakIds
		);
		// Check each remaining opponent to see if the best-of-three is finished
		for (const opponent of opponentsNotOnCooldown) {
			const results = bo3Map.get(opponent.keycloakId) || {won: 0, lost: 0, draw: 0};
			if (bo3isAlreadyFinished(results)) {
				// If the Bo3 is already finished, skip this opponent
				continue;
			}
			// Found a valid opponent
			return opponent;
		}
	}
}

export default class FightCommand {
	@commandRequires(CommandFightPacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: FightConstants.REQUIRED_LEVEL
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandFightPacketReq, context: PacketContext): Promise<void> {
		const toCheckPlayer = await Players.getAskedPlayer({keycloakId: packet.playerKeycloakId}, player);

		const collector = new ReactionCollectorFight(
			await getPlayerStats(toCheckPlayer)
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				const opponent = await findOpponent(player);
				if (!opponent) {
					// Error message if no opponent found
				}
				// Start fight
			}
			else {
				response.push(makePacket(CommandFightRefusePacketRes, {}));
			}
		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.FIGHT_CONFIRMATION)
			.build();

		response.push(collectorPacket);
	}
}

