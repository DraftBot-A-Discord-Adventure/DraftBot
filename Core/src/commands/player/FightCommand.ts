import {
	CrowniclesPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/CrowniclesPacket";
import Player, { Players } from "../../core/database/game/models/Player";
import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";
import { FightConstants } from "../../../../Lib/src/constants/FightConstants";
import { ReactionCollectorFight } from "../../../../Lib/src/packets/interaction/ReactionCollectorFight";
import {
	EndCallback, ReactionCollectorInstance
} from "../../core/utils/ReactionsCollector";
import { ReactionCollectorAcceptReaction } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	CommandFightNotEnoughEnergyPacketRes,
	CommandFightOpponentsNotFoundPacket,
	CommandFightPacketReq,
	CommandFightRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandFightPacket";
import { BlockingConstants } from "../../../../Lib/src/constants/BlockingConstants";
import { InventorySlots } from "../../core/database/game/models/InventorySlot";
import {
	LogsReadRequests,
	PersonalFightDailySummary,
	RankedFightResult
} from "../../core/database/logs/LogsReadRequests";
import { FightController } from "../../core/fights/FightController";
import { FightOvertimeBehavior } from "../../core/fights/FightOvertimeBehavior";
import { PlayerFighter } from "../../core/fights/fighter/PlayerFighter";
import { ClassDataController } from "../../data/Class";
import { crowniclesInstance } from "../../index";
import { EloUtils } from "../../core/utils/EloUtils";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { AiPlayerFighter } from "../../core/fights/fighter/AiPlayerFighter";
import { BlockingUtils } from "../../core/utils/BlockingUtils";
import { FightRewardPacket } from "../../../../Lib/src/packets/fights/FightRewardPacket";
import { LeagueDataController } from "../../data/League";
import { WhereAllowed } from "../../../../Lib/src/types/WhereAllowed";
import { minutesToMilliseconds } from "../../../../Lib/src/utils/TimeUtils";
import { EloGameResult } from "../../../../Lib/src/types/EloGameResult";
import { PacketUtils } from "../../core/utils/PacketUtils";
import { PlayerWasAttackedNotificationPacket } from "../../../../Lib/src/packets/notifications/PlayerWasAttackedNotificationPacket";

type PlayerStats = {
	classId: number;
	fightRanking: {
		glory: number;
	};
	energy: {
		value: number;
		max: number;
	};
	attack: number;
	defense: number;
	speed: number;
	breath: {
		base: number;
		max: number;
		regen: number;
	};
};

type FightInitiatorInformation = {
	playerDailyFightSummary: PersonalFightDailySummary;
	initiatorGameResult: number;
	initiatorReference: number;
};

/*
 * Map to store the cooldowns of players who have been defenders in ranked fights
 * It is updated just before starting a fight, so it prevents a single player to defend two players at the same time as
 * Fights are logged at the end of the fight
 */
const fightsDefenderCooldowns = new Map<string, number>();

async function getPlayerStats(player: Player): Promise<PlayerStats> {
	const playerActiveObjects = await InventorySlots.getMainSlotsItems(player.id);
	return {
		classId: player.class,
		fightRanking: {
			glory: player.getGloryPoints()
		},
		energy: {
			value: player.getCumulativeEnergy(),
			max: player.getMaxCumulativeEnergy()
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
 * Calculate the money reward for the initiator of the fight
 * @param fightInitiatorInformation Information about the fight initiator
 * @param player1 First player in the fight not necessarily the initiator
 * @param player2 Second player in the fight not necessarily the defender
 * @param response Packet response array
 * @returns The amount of money rewarded
 */
async function calculateMoneyReward(
	fightInitiatorInformation: FightInitiatorInformation,
	player1: Player,
	player2: Player,
	response: CrowniclesPacket[]
): Promise<number> {
	// Determine the bonus to reward based on a game result
	const bonusByResult = {
		[EloGameResult.WIN]: FightConstants.REWARDS.WIN_MONEY_BONUS,
		[EloGameResult.DRAW]: FightConstants.REWARDS.DRAW_MONEY_BONUS,
		[EloGameResult.LOSS]: FightConstants.REWARDS.LOSS_MONEY_BONUS
	};

	let extraMoneyBonus = bonusByResult[fightInitiatorInformation.initiatorGameResult as EloGameResult];

	// Calculate already awarded money
	const summary = fightInitiatorInformation.playerDailyFightSummary;
	const lossCount = summary.played - (summary.draw + summary.won);

	const alreadyAwardedMoney =
		summary.won * FightConstants.REWARDS.WIN_MONEY_BONUS
		+ summary.draw * FightConstants.REWARDS.DRAW_MONEY_BONUS
		+ lossCount * FightConstants.REWARDS.LOSS_MONEY_BONUS;

	// Apply cap to money rewards if necessary
	if (alreadyAwardedMoney > FightConstants.REWARDS.MAX_MONEY_BONUS) {
		extraMoneyBonus = Math.max(
			FightConstants.REWARDS.MAX_MONEY_BONUS - (alreadyAwardedMoney - extraMoneyBonus),
			0
		);
	}

	// Add money to the appropriate player
	const targetPlayer = fightInitiatorInformation.initiatorReference === 0 ? player1 : player2;
	await targetPlayer.addMoney({
		amount: extraMoneyBonus,
		response,
		reason: NumberChangeReason.FIGHT
	});

	return extraMoneyBonus;
}

/**
 * Calculate the score reward for the initiator of the fight
 * @param fightInitiatorInformation
 * @param player1 - one of the players in the fight (not necessary the initiator)
 * @param player2 - the other player in the fight (not necessary the defender)
 * @param response
 */
async function calculateScoreReward(fightInitiatorInformation: FightInitiatorInformation, player1: Player, player2: Player, response: CrowniclesPacket[]): Promise<number> {
	let scoreBonus = 0;

	// Award extra score points only to the initiator for one of his first wins of the day.
	if (fightInitiatorInformation.initiatorGameResult === EloGameResult.WIN && fightInitiatorInformation.playerDailyFightSummary.won <= FightConstants.REWARDS.NUMBER_OF_WIN_THAT_AWARD_SCORE_BONUS) {
		scoreBonus = FightConstants.REWARDS.SCORE_BONUS_AWARD;
		if (fightInitiatorInformation.initiatorReference === 0) {
			await player1.addScore({
				amount: scoreBonus,
				response,
				reason: NumberChangeReason.FIGHT
			});
		}
		else {
			await player2.addScore({
				amount: scoreBonus,
				response,
				reason: NumberChangeReason.FIGHT
			});
		}
	}
	return scoreBonus;
}

/**
 * Update the players' glory and cooldowns after a fight
 * @param attacker
 * @param defender
 * @param attackerGameResult
 * @param defenderGameResult
 * @param response
 * @param fightLogId
 */
async function updatePlayersEloAndCooldowns(
	attacker: Player,
	defender: Player,
	attackerGameResult: EloGameResult,
	defenderGameResult: EloGameResult,
	response: CrowniclesPacket[],
	fightLogId: number
): Promise<void> {
	// Calculate elo
	const player1KFactor = EloUtils.getKFactor(attacker);
	const player2KFactor = EloUtils.getKFactor(defender);
	const player1NewRating = EloUtils.calculateNewRating(attacker.attackGloryPoints, defender.defenseGloryPoints, attackerGameResult, player1KFactor);
	const player2NewRating = EloUtils.calculateNewRating(defender.defenseGloryPoints, attacker.attackGloryPoints, defenderGameResult, player2KFactor);

	// Change glory and fightCountdown and save
	await attacker.setGloryPoints(player1NewRating, false, NumberChangeReason.FIGHT, response, fightLogId);
	attacker.fightCountdown--;
	if (attacker.fightCountdown < 0) {
		attacker.fightCountdown = 0;
	}
	await defender.setGloryPoints(player2NewRating, true, NumberChangeReason.FIGHT, response, fightLogId);
	defender.fightCountdown--;
	if (defender.fightCountdown < 0) {
		defender.fightCountdown = 0;
	}
	await Promise.all([
		attacker.save(),
		defender.save()
	]);
}

/**
 * Code that will be executed when a fight ends (except if the fight has a bug)
 * @param fight
 * @param response
 */
async function fightEndCallback(fight: FightController, response: CrowniclesPacket[]): Promise<void> {
	const defendingFighter = fight.getNonFightInitiatorFighter();
	if (defendingFighter instanceof AiPlayerFighter) {
		PacketUtils.sendNotifications([
			makePacket(PlayerWasAttackedNotificationPacket, {
				keycloakId: defendingFighter.player.keycloakId,
				attackedByPlayerKeycloakId: fight.fightInitiator.player.keycloakId
			})
		]);
	}
	const fightLogId = await crowniclesInstance.logsDatabase.logFight(fight);

	const player1GameResult = fight.isADraw() ? EloGameResult.DRAW : fight.getWinner() === 0 ? EloGameResult.WIN : EloGameResult.LOSS;
	const player2GameResult = player1GameResult === EloGameResult.DRAW ? EloGameResult.DRAW : player1GameResult === EloGameResult.WIN ? EloGameResult.LOSS : EloGameResult.WIN;

	// Get the fight initiator reference (0 if the initiator is player1, 1 if the initiator is player2)
	const initiatorReference = fight.fightInitiator.player.keycloakId === (fight.fighters[0] as PlayerFighter).player.keycloakId ? 0 : 1;
	const initiatorGameResult = fight.fighters[0] instanceof PlayerFighter
	&& fight.fightInitiator.player.keycloakId === fight.fighters[0].player.keycloakId
		? player1GameResult
		: player2GameResult;
	const defenderGameResult = initiatorGameResult === player1GameResult ? player2GameResult : player1GameResult;

	// Player variables
	const player1 = await Players.getById((fight.fighters[0] as PlayerFighter).player.id);
	const player2 = await Players.getById((fight.fighters[1] as PlayerFighter).player.id);

	// Attacker and defender players
	const attacker = initiatorReference === 0 ? player1 : player2;
	const defender = initiatorReference === 0 ? player2 : player1;

	const playerDailyFightSummary = await LogsReadRequests.getPersonalInitiatedFightDailySummary(
		fight.fightInitiator.player.keycloakId
	);

	const scoreBonus = await calculateScoreReward(
		{
			playerDailyFightSummary,
			initiatorGameResult,
			initiatorReference
		},
		player1,
		player2,
		response
	);

	const extraMoneyBonus = await calculateMoneyReward(
		{
			playerDailyFightSummary,
			initiatorGameResult,
			initiatorReference
		},
		player1,
		player2,
		response
	);

	// Save glory before changing it
	const player1OldGlory = player1.getGloryPoints();
	const player2OldGlory = player2.getGloryPoints();
	await updatePlayersEloAndCooldowns(attacker, defender, initiatorGameResult, defenderGameResult, response, fightLogId);

	response.push(makePacket(FightRewardPacket, {
		points: scoreBonus,
		money: extraMoneyBonus,
		player1: {
			keycloakId: player1.keycloakId,
			oldGlory: player1OldGlory,
			newGlory: player1.getGloryPoints(),
			oldLeagueId: LeagueDataController.instance.getByGlory(player1OldGlory).id,
			newLeagueId: player1.getLeague().id
		},
		player2: {
			keycloakId: player2.keycloakId,
			oldGlory: player2OldGlory,
			newGlory: player2.getGloryPoints(),
			oldLeagueId: LeagueDataController.instance.getByGlory(player2OldGlory).id,
			newLeagueId: player2.getLeague().id
		},
		draw: player1GameResult === EloGameResult.DRAW && player2GameResult === EloGameResult.DRAW
	}));
}

/**
 * Check if a BO3 is already finished (three games played or two wins)
 * @param bo3
 */
function bo3isAlreadyFinished(bo3: RankedFightResult): boolean {
	return bo3.won > 1 || bo3.lost > 1 || bo3.draw + bo3.won + bo3.lost >= 3;
}

/**
 * Check if these players have been defenders recently in the cache map
 * @param validOpponents
 */
function checkPlayersInDefenderCacheMap(validOpponents: Player[]): Player[] {
	const now = Date.now();
	return validOpponents.filter(opponent => {
		const cooldown = fightsDefenderCooldowns.get(opponent.keycloakId);
		if (cooldown) {
			return cooldown < now;
		}
		return true;
	});
}

/**
 * Get the initial valid opponents based on the offset and player
 * @param offset
 * @param player
 */
async function getInitialValidOpponents(offset: number, player: Player): Promise<Player[]> {
	let validOpponents: Player[];
	if (offset === 0) {
		// Fetch both active and regular potential opponents
		const activeOpponents = await Players.findActivePotentialOpponents(
			player,
			FightConstants.ACTIVE_PLAYER_PER_OPPONENT_SEARCH,
			offset
		);
		const regularOpponents = await Players.findPotentialOpponents(
			player,
			FightConstants.PLAYER_PER_OPPONENT_SEARCH,
			offset
		);

		// Combine and remove duplicates based on keycloakId
		validOpponents = [...activeOpponents];
		for (const opp of regularOpponents) {
			if (!validOpponents.some(p => p.keycloakId === opp.keycloakId)) {
				validOpponents.push(opp);
			}
		}
		return validOpponents;
	}
	return await Players.findPotentialOpponents(
		player,
		FightConstants.PLAYER_PER_OPPONENT_SEARCH,
		offset - 1
	);
}

/**
 * Find another player to fight the player that started the command
 * @param player - player that wants to fight
 * @returns player opponent
 */
async function findOpponent(player: Player): Promise<Player | null> {
	for (let offset = 0; offset <= FightConstants.MAX_OFFSET_FOR_OPPONENT_SEARCH; offset++) {
		// Retrieve some potential opponents
		let validOpponents = await getInitialValidOpponents(offset, player);

		if (validOpponents.length === 0) {
			continue;
		}

		// Shuffle the array of opponents to randomize who gets picked first
		validOpponents.sort(() => Math.random() - 0.5);

		// Check if these players have been defenders recently in the cache map
		validOpponents = checkPlayersInDefenderCacheMap(validOpponents);

		// Check if these players have been defenders recently in the database
		const haveBeenDefenderRecently = await LogsReadRequests.hasBeenADefenderInRankedFightSinceMinutes(
			validOpponents.map(opponent => opponent.keycloakId),
			FightConstants.DEFENDER_COOLDOWN_MINUTES
		);

		// Filter out opponents who have been defenders too recently
		const opponentsNotOnCooldown = validOpponents.filter(
			opponent => !haveBeenDefenderRecently[opponent.keycloakId]
		);

		// If nobody is off cooldown in this batch, continue to the next offset
		if (opponentsNotOnCooldown.length === 0) {
			continue;
		}

		// Get IDs for the remaining opponents
		const remainingOpponentKeycloakIds = opponentsNotOnCooldown.map(
			opponent => opponent.keycloakId
		);

		// Fetch the fight results against all remaining valid opponents
		const bo3Map = await LogsReadRequests.getRankedFightsThisWeek(
			player.keycloakId,
			remainingOpponentKeycloakIds
		);

		// Check each remaining opponent to see if the best-of-three is finished
		for (const opponent of opponentsNotOnCooldown) {
			const results = bo3Map.get(opponent.keycloakId) ?? {
				won: 0, lost: 0, draw: 0
			};
			if (!bo3isAlreadyFinished(results)) {
				return opponent;
			}
		}
	}
	return null;
}

function fightValidationEndCallback(player: Player, context: PacketContext): EndCallback {
	return async (collector, response): Promise<void> => {
		const reaction = collector.getFirstReaction();
		if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
			const opponent = await findOpponent(player);
			if (!opponent) {
				response.push(makePacket(CommandFightOpponentsNotFoundPacket, {}));
				BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.FIGHT_CONFIRMATION);
				return;
			}
			const askingFighter = new PlayerFighter(player, ClassDataController.instance.getById(player.class));
			await askingFighter.loadStats();
			const incomingFighter = new AiPlayerFighter(opponent, ClassDataController.instance.getById(opponent.class));
			await incomingFighter.loadStats();

			// Start fight
			const fightController = new FightController(
				{
					fighter1: askingFighter, fighter2: incomingFighter
				},
				FightOvertimeBehavior.END_FIGHT_DRAW,
				context
			);
			fightController.setEndCallback(fightEndCallback);
			fightsDefenderCooldowns.set(opponent.keycloakId, Date.now() + minutesToMilliseconds(FightConstants.DEFENDER_COOLDOWN_MINUTES));
			await fightController.startFight(response);
		}
		else {
			response.push(makePacket(CommandFightRefusePacketRes, {}));
		}
		BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.FIGHT_CONFIRMATION);
	};
}

export default class FightCommand {
	@commandRequires(CommandFightPacketReq, {
		notBlocked: true,
		whereAllowed: [WhereAllowed.CONTINENT],
		allowedEffects: CommandUtils.ALLOWED_EFFECTS.NO_EFFECT,
		level: FightConstants.REQUIRED_LEVEL
	})
	async execute(response: CrowniclesPacket[], player: Player, _packet: CommandFightPacketReq, context: PacketContext): Promise<void> {
		if (!player.hasEnoughEnergyToFight()) {
			response.push(makePacket(CommandFightNotEnoughEnergyPacketRes, {}));
			return;
		}

		const collector = new ReactionCollectorFight(
			await getPlayerStats(player)
		);

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			fightValidationEndCallback(player, context)
		)
			.block(player.keycloakId, BlockingConstants.REASONS.FIGHT_CONFIRMATION)
			.build();

		response.push(collectorPacket);
	}
}
