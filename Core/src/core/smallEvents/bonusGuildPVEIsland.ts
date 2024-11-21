import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {
	SmallEventBonusGuildPVEIslandOutcomeSurrounding,
	SmallEventBonusGuildPVEIslandPacket,
	SmallEventBonusGuildPVEIslandResultType
} from "../../../../Lib/src/packets/smallEvents/SmallEventBonusGuildPVEIslandPacket";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {Maps} from "../maps/Maps";
import Player from "../database/game/models/Player";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {Guilds} from "../database/game/models/Guild";

enum Outcome {
	EXPERIENCE = "experience",
	MONEY = "money",
	LIFE = "life",
	ENERGY = "energy",
	EXP_OR_POINTS_GUILD = "expOrPointsGuild"
}

type BonusGuildPVEIslandProperties = {
	events: {
		[key in SmallEventBonusGuildPVEIslandResultType]: {
			withGuild: Outcome;
			solo: Outcome;
		};
	}[];
	ranges: {
		[key in Outcome]: {
			min: number;
			max: number;
		}
	}
};

async function hasEnoughMemberOnPVEIsland(player: Player): Promise<boolean> {
	return (await Maps.getGuildMembersOnPveIsland(player)).length >= RandomUtils.randInt(1, 4);
}

async function applyPossibility(
	player: Player,
	response: DraftBotPacket[],
	issue: SmallEventBonusGuildPVEIslandResultType,
	rewardKind: Outcome
): Promise<{ amount: number, isExperienceGain: boolean }> {
	const range = SmallEventDataController.instance.getById("bonusGuildPVEIsland").getProperties<BonusGuildPVEIslandProperties>().ranges[rewardKind];
	const result = {
		amount: RandomUtils.randInt(range.min, range.max),
		isExperienceGain: rewardKind === Outcome.EXP_OR_POINTS_GUILD && RandomUtils.draftbotRandom.bool()
	};
	if (issue === SmallEventBonusGuildPVEIslandResultType.SUCCESS && player.isInGuild()) {
		const guild = await Guilds.getById(player.guildId);
		const caller = result.isExperienceGain ? guild.addExperience : guild.addScore;
		await caller(result.amount, response, NumberChangeReason.SMALL_EVENT);
		await guild.save();
		return result;
	}
	switch (rewardKind) {
	case Outcome.MONEY:
		await player.addMoney({amount: -result.amount, response, reason: NumberChangeReason.SMALL_EVENT});
		break;
	case Outcome.LIFE:
		await player.addHealth(-result.amount, response, NumberChangeReason.SMALL_EVENT);
		await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
		break;
	case Outcome.ENERGY:
		player.addEnergy(-result.amount, NumberChangeReason.SMALL_EVENT);
		break;
	case Outcome.EXPERIENCE:
		await player.addExperience({amount: result.amount, response, reason: NumberChangeReason.SMALL_EVENT});
		break;
	default:
		break;
	}
	await player.save();
	return result;
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnPveIsland,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const bonusGuildPVEIslandProperties = SmallEventDataController.instance.getById("bonusGuildPVEIsland").getProperties<BonusGuildPVEIslandProperties>();
		const event: number = RandomUtils.randInt(0, bonusGuildPVEIslandProperties.events.length);
		const probabilities = RandomUtils.randInt(0, 100);
		const enoughMembers = await hasEnoughMemberOnPVEIsland(player);
		const issue: SmallEventBonusGuildPVEIslandResultType = probabilities < SmallEventConstants.BONUS_GUILD_PVE_ISLANDS.PROBABILITIES.SUCCESS || enoughMembers
			? SmallEventBonusGuildPVEIslandResultType.SUCCESS
			: probabilities < SmallEventConstants.BONUS_GUILD_PVE_ISLANDS.PROBABILITIES.ESCAPE
				? SmallEventBonusGuildPVEIslandResultType.ESCAPE
				: SmallEventBonusGuildPVEIslandResultType.LOSE;

		response.push(makePacket(SmallEventBonusGuildPVEIslandPacket, {
			event,
			result: issue,
			surrounding: player.isInGuild()
				? !enoughMembers && issue === SmallEventBonusGuildPVEIslandResultType.SUCCESS
					? SmallEventBonusGuildPVEIslandOutcomeSurrounding.SOLO_WITH_GUILD
					: SmallEventBonusGuildPVEIslandOutcomeSurrounding.WITH_GUILD
				: SmallEventBonusGuildPVEIslandOutcomeSurrounding.SOLO,
			...issue === SmallEventBonusGuildPVEIslandResultType.ESCAPE
				? {amount: 0, isExperienceGain: false}
				: await applyPossibility(player, response, issue, bonusGuildPVEIslandProperties.events[event][issue][
					player.isInGuild()
						? SmallEventBonusGuildPVEIslandOutcomeSurrounding.WITH_GUILD
						: SmallEventBonusGuildPVEIslandOutcomeSurrounding.SOLO
				])
		}));
	}
};