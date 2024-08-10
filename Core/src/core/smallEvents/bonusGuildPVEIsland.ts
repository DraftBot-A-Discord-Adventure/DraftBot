import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {SmallEventBonusGuildPVEIslandPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBonusGuildPVEIslandPacket";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {Maps} from "../maps/Maps";
import Player from "../database/game/models/Player";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {Guilds} from "../database/game/models/Guild";

type Malus = {
    "name": string;
    "min": number;
    "max": number;
};

type GuildBonus = {
    "withGuild"?: Malus;
    "malus"?: Malus;
};

type EventOutcome = {
    "success"?: GuildBonus;
    "escape"?: GuildBonus;
    "loose"?: GuildBonus;
};

type BonusGuildPVEIslandProperties = {
    "properties": {
		"events": {
			[key: string]: EventOutcome;
		};
	}
};

async function hasEnoughMemberOnPVEIsland(player: Player): Promise<boolean> {
	return player.isInGuild() ? (await Maps.getGuildMembersOnPveIsland(player)).length >= RandomUtils.randInt(1, 4) : false;
}

async function applyPossibility(player: Player, response: DraftBotPacket[], malus: Malus): Promise<[string, boolean?]> {
	const malusName = malus.name;
	const amount = RandomUtils.randInt(malus.min, malus.max);

	if (malusName === "expOrPointsGuild") {
		const guild = await Guilds.getById(player.guildId);
		const draw = RandomUtils.draftbotRandom.bool();
		if (draw) {
			await guild.addExperience(amount, response, NumberChangeReason.SMALL_EVENT);
		}
		else {
			await guild.addScore(amount, response, NumberChangeReason.SMALL_EVENT);
		}
		await guild.save();
		return [amount.toString(), draw];
	}

	switch (malusName) {
	case "money":
		await player.addMoney({
			amount: -amount,
			response,
			reason: NumberChangeReason.SMALL_EVENT
		});
		break;
	case "exp":
		await player.addExperience({
			amount,
			response,
			reason: NumberChangeReason.SMALL_EVENT
		});
		break;
	case "life":
		await player.addHealth(-amount, response, NumberChangeReason.SMALL_EVENT);
		await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
		break;
	case "energy":
		player.addEnergy(-amount, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		break;
	}
	await player.save();
	return [amount.toString()];
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnPveIsland,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		if (!await hasEnoughMemberOnPVEIsland(player)) {
			response.push(makePacket(SmallEventBonusGuildPVEIslandPacket, {hasEnoughMemberOnPVEIsland: false, eventName: "", amount: "", isXp: false}));
			return;
		}

		const bonusGuildPVEIslandProperties = SmallEventDataController.instance.getById("bonusGuildPVEIsland").getProperties<BonusGuildPVEIslandProperties>();
		const eventName = RandomUtils.draftbotRandom.pick(Object.keys(bonusGuildPVEIslandProperties.properties.events));
		const event = bonusGuildPVEIslandProperties.properties.events[eventName];

		const probabilities = RandomUtils.randInt(0, 100);
		let issue: GuildBonus;
		if (probabilities < SmallEventConstants.BONUS_GUILD_PVE_ISLANDS.PROBABILITIES.SUCCESS) {
			issue = event.success;
		}
		else if (probabilities < SmallEventConstants.BONUS_GUILD_PVE_ISLANDS.PROBABILITIES.ESCAPE) {
			issue = event.escape;
		}
		else {
			issue = event.loose;
		}

		const isInGuild = player.isInGuild();
		const malus = isInGuild ? issue.withGuild : issue.malus;
		const [amount, isXp] = await applyPossibility(player, response, malus);

		response.push(makePacket(SmallEventBonusGuildPVEIslandPacket, {
			hasEnoughMemberOnPVEIsland: true,
			eventName,
			amount,
			isXp
		}));
	}
};