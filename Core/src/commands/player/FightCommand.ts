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
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";

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
 * Find another player to fight the player that started the command
 * @param player - player that wants to fight
 * @param offset - offset to start the search in case the first try did not work
 * @returns player opponent
 */
async function findOpponent(player: Player, offset: number): Promise<Player | null> {
	const closestPlayers = await Players.findByDefenseGlory(
		player.attackGloryPoints,
		FightConstants.PLAYER_PER_OPPONENT_SEARCH,
		offset
	);

	// Remove the current player from the list (cannot fight itself)
	const opponentCandidates = closestPlayers.filter(
		(closestPlayer) => closestPlayer.id !== player.id
	);

	// Filter opponents based on level and ELO gap
	const validOpponents = opponentCandidates.filter(
		(opponent) =>
			opponent.level >= FightConstants.REQUIRED_LEVEL &&
			Math.abs(player.defenseGloryPoints - opponent.attackGloryPoints) <= FightConstants.ELO.MAX_ELO_GAP
	);

	if (validOpponents.length === 0) {
		// No valid opponents found at this offset
		if (offset > FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH) {
			return null;
		}
		// Recursively search with increased offset
		return findOpponent(player, offset + 1);
	}

	// Shuffle array
	validOpponents.sort(() => Math.random() - 0.5);

	// Get the keycloak IDs of valid opponents
	const opponentKeycloakIds = validOpponents.map((opponent) => opponent.keycloakId);

	// Check if these players have been defenders recently
	const haveBeenDefenderRecently = await LogsReadRequests.hasBeenADefenderInRankedFightSinceMinute(
		opponentKeycloakIds,
		FightConstants.DEFENDER_COOLDOWN_MINUTES
	);

	// Filter out opponents who have been defenders recently
	const opponentsNotOnCooldown = validOpponents.filter(
		(opponent) => !haveBeenDefenderRecently[opponent.keycloakId]
	);

	if (opponentsNotOnCooldown.length === 0) {
		// No valid opponents found after defender cooldown filter
		if (offset > FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH) {
			return null;
		}
		// Recursively search with increased offset
		return findOpponent(player, offset + 1);
	}

	// Now get the keycloak IDs of the remaining opponents
	const remainingOpponentKeycloakIds = opponentsNotOnCooldown.map((opponent) => opponent.keycloakId);

	// Fetch the fight results against all remaining valid opponents in one call
	const bo3Map = await LogsReadRequests.getRankedFightsThisWeek(
		player.keycloakId,
		remainingOpponentKeycloakIds
	);

	// Now iterate over opponentsNotOnCooldown and find the first one that meets all conditions
	for (const opponent of opponentsNotOnCooldown) {
		// Get the fight result for this opponent from the map
		const bo3 = bo3Map.get(opponent.keycloakId) || { won: 0, lost: 0, draw: 0 };

		if (bo3.won > 1 || bo3.lost > 1 || bo3.draw + bo3.won + bo3.lost >= 3) {
			// Max fights already played with this opponent
			continue;
		}

		// Found a valid opponent
		return opponent;
	}

	// No valid opponents found in this batch, recursively search with increased offset
	if (offset > FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH) {
		return null;
	}

	return findOpponent(player, offset + 1);
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
				const opponent = await findOpponent(player, 0);
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

