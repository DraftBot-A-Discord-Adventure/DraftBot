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
	const closestPlayers = await Players.findByDefenseGlory(player.attackGloryPoints, FightConstants.PLAYER_PER_OPPONENT_SEARCH, offset)
	//shuffle array
	closestPlayers.sort(() => Math.random() - 0.5);
	let selectedPlayer: Player = null;
	for (const closestPlayer of closestPlayers) {
		if (
			closestPlayer.id === player.id || // cannot fight itself
			closestPlayer.level < FightConstants.REQUIRED_LEVEL || // level too low
			Math.abs(player.defenseGloryPoints - closestPlayer.attackGloryPoints) > FightConstants.ELO.MAX_ELO_GAP // ELO gap too large
		) {
			continue;
		}
		if (
			await LogsReadRequests.hasBeenADefenderInRankedFightSinceMinute(
				closestPlayer.keycloakId,
				FightConstants.DEFENDER_COOLDOWN_MINUTES
			)
		) {
			continue; // defender on cooldown
		}
		const bo3 = await LogsReadRequests.getRankedFightsThisWeek(player.keycloakId, closestPlayer.keycloakId);
		if (
			bo3.won > 1 ||
			bo3.lost > 1 ||
			bo3.draw + bo3.won + bo3.lost >= 3
		) {
			continue; // max fights already played
		}
		selectedPlayer = closestPlayer;
	}
	if (selectedPlayer || offset > FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH) {
		return selectedPlayer;
	}
	else {
		return findOpponent(player, offset + 1);
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
				const opponent = await findOpponent(player, 0);
				if (!opponent) {
					// error message if no opponent found
				}
				// start fight
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

