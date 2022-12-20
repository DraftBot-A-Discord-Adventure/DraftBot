import Player, {EditValueParameters} from "../database/game/models/Player";
import {NumberChangeReason} from "../constants/LogsConstants";
import {giveRandomItem} from "../utils/ItemUtils";
import MapLink, {MapLinks} from "../database/game/models/MapLink";
import {TextInformation} from "../utils/MessageUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {EffectsConstants} from "../constants/EffectsConstants";
import {Constants} from "../Constants";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {minutesDisplay} from "../utils/TimeUtils";
import {Maps} from "../maps/Maps";

async function applyOutcomeScore(time: number, player: Player, valuesToEditParameters: EditValueParameters, textInformation: TextInformation): Promise<string> {
	const scoreChange = time + RandomUtils.draftbotRandom.integer(0, time / Constants.REPORT.BONUS_POINT_TIME_DIVIDER) + await PlayerSmallEvents.calculateCurrentScore(player);
	await player.addScore(Object.assign(valuesToEditParameters, {amount: scoreChange}));
	return textInformation.tr.format("points", {score: scoreChange});
}

async function applyOutcomeExperience(outcome: PossibilityOutcome, player: Player, valuesToEditParameters: EditValueParameters, textInformation: TextInformation): Promise<string> {
	let experienceChange = 150 +
		(outcome.health > 0 ? 200 : 0) +
		(outcome.randomItem === true ? 300 : 0) +
		(outcome.money > 0 ? 100 : 0);
	switch (outcome.effect ?? EffectsConstants.EMOJI_TEXT.SMILEY) {
	case EffectsConstants.EMOJI_TEXT.OCCUPIED:
		experienceChange -= 150;
		break;
	case EffectsConstants.EMOJI_TEXT.SLEEPING:
	case EffectsConstants.EMOJI_TEXT.STARVING:
		experienceChange -= 130;
		break;
	case EffectsConstants.EMOJI_TEXT.CONFOUNDED:
		experienceChange -= 140;
		break;
	case EffectsConstants.EMOJI_TEXT.SMILEY:
		break;
	default:
		experienceChange = 0;
	}
	if (outcome.health < 0 || outcome.oneshot === true || experienceChange < 0) {
		experienceChange = 0;
	}
	if (experienceChange !== 0) {
		await player.addExperience(Object.assign(valuesToEditParameters, {amount: experienceChange}));
		return textInformation.tr.format("experience", {experience: experienceChange});
	}
	return "";
}

async function applyOutcomeEffect(outcome: PossibilityOutcome, player: Player, textInformation: TextInformation): Promise<string> {
	await player.setLastReportWithEffect(
		outcome.lostTime ?? 0,
		outcome.effect ?? EffectsConstants.EMOJI_TEXT.SMILEY
	);
	if (outcome.lostTime && outcome.lostTime > 0 && outcome.effect === EffectsConstants.EMOJI_TEXT.OCCUPIED) {
		return textInformation.tr.format("timeLost", {timeLost: minutesDisplay(outcome.lostTime)});
	}
	return "";
}

async function applyOutcomeHealth(outcome: PossibilityOutcome, player: Player, textInformation: TextInformation): Promise<string> {
	if (outcome.health && outcome.health !== 0) {
		await player.addHealth(outcome.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
		if (outcome.health < 0) {
			return textInformation.tr.format("healthLoose", {health: -outcome.health});
		}
		return textInformation.tr.format("health", {health: outcome.health});
	}
	return "";
}

async function applyOutcomeMoney(outcome: PossibilityOutcome, time: number, player: Player, valuesToEditParameters: EditValueParameters, textInformation: TextInformation): Promise<string> {
	let moneyChange = (outcome.money ?? 0) + Math.round(time / 10 + RandomUtils.draftbotRandom.integer(0, time / 10 + player.level / 5 - 1));
	if (outcome.money && outcome.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(outcome.money / 2);
	}
	if (moneyChange !== 0) {
		await player.addMoney(Object.assign(valuesToEditParameters, {amount: moneyChange}));
		return moneyChange >= 0
			? textInformation.tr.format("money", {money: moneyChange})
			: textInformation.tr.format("moneyLoose", {money: -moneyChange});
	}
	return "";
}

async function applyOutcomeRandomItem(outcome: PossibilityOutcome, textInformation: TextInformation, player: Player): Promise<void> {
	if (outcome.randomItem === true) {
		await giveRandomItem((await textInformation.interaction.guild.members.fetch(player.discordUserId)).user, textInformation.interaction.channel, textInformation.language, player);
	}
}

async function applyOutcomeOneshot(outcome: PossibilityOutcome, player: Player, textInformation: TextInformation): Promise<void> {
	if (outcome.oneshot === true) {
		await player.addHealth(-player.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
	}
}

function applyOutcomeNextEvent(outcome: PossibilityOutcome, player: Player): void {
	if (outcome.nextEvent) {
		player.nextEvent = outcome.nextEvent;
	}
}

function getOutcomeAlterationEmoji(outcome: PossibilityOutcome): string {
	const emojiEnd = outcome.effect && outcome.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && outcome.effect !== EffectsConstants.EMOJI_TEXT.OCCUPIED ? ` ${outcome.effect}` : "";
	return outcome.oneshot === true ? ` ${EffectsConstants.EMOJI_TEXT.DEAD} ` : emojiEnd;
}

async function getNextMapLink(outcome: PossibilityOutcome, player: Player): Promise<MapLink> {
	if (outcome.mapTypesDestination || outcome.mapTypesExcludeDestination) {
		let allowedMapTypes = await Maps.getConnectedMapTypes(player, Boolean(outcome.mapTypesDestination));
		if (outcome.mapTypesDestination) {
			allowedMapTypes = allowedMapTypes.filter(mapType => outcome.mapTypesDestination.includes(mapType));
		}
		if (outcome.mapTypesExcludeDestination) {
			allowedMapTypes = allowedMapTypes.filter(mapType => !outcome.mapTypesExcludeDestination.includes(mapType));
		}

		return RandomUtils.draftbotRandom.pick(
			await MapLinks.getMapLinksWithMapTypes(
				allowedMapTypes,
				await player.getDestinationId(),
				outcome.mapTypesDestination ? await player.getPreviousMapId() : null
			)
		);
	}

	return null;
}

/**
 * Apply a possibility outcome to a player
 * @param outcome
 * @param textInformation
 * @param player
 * @param time
 */
export async function applyPossibilityOutcome(outcome: PossibilityOutcome,
	textInformation: TextInformation, player: Player, time: number): Promise<{
	description: string,
	alterationEmoji: string,
	forcedDestination: MapLink
}> {
	const valuesToEditParameters: EditValueParameters = {
		channel: textInformation.interaction.channel,
		language: textInformation.language,
		reason: NumberChangeReason.BIG_EVENT,
		amount: 0
	};
	let description = "";

	// score
	description += await applyOutcomeScore(time, player, valuesToEditParameters, textInformation);

	// money
	description += await applyOutcomeMoney(outcome, time, player, valuesToEditParameters, textInformation);

	// health
	description += await applyOutcomeHealth(outcome, player, textInformation);

	// experience
	description += await applyOutcomeExperience(outcome, player, valuesToEditParameters, textInformation);

	// effect + lost time
	description += await applyOutcomeEffect(outcome, player, textInformation);

	// random item
	await applyOutcomeRandomItem(outcome, textInformation, player);

	// next event
	applyOutcomeNextEvent(outcome, player);

	// oneshot
	await applyOutcomeOneshot(outcome, player, textInformation);

	return {
		description,
		alterationEmoji: getOutcomeAlterationEmoji(outcome),
		forcedDestination: await getNextMapLink(outcome, player)
	};
}

export interface PossibilityOutcome {
	/**
	 * Time lost for the lost time effect
	 */
	lostTime?: number;

	/**
	 * Health lost or won
	 */
	health?: number;

	/**
	 * Effect to apply
	 */
	effect?: string;

	/**
	 * Money lost or won
	 */
	money?: number;

	/**
	 * Give a random item
	 */
	randomItem?: boolean;

	/**
	 * One shot the player
	 */
	oneshot?: boolean;

	/**
	 * Forced next event
	 */
	nextEvent?: number;

	/**
	 * Choose a random map type to go in the list
	 */
	mapTypesDestination?: string[];

	/**
	 * Exclude these map types in the destination choice
	 */
	mapTypesExcludeDestination?: string[];

	/**
	 * Translations
	 */
	translations: { [language: string]: string }

	/**
	 * Tags
	 */
	tags?: string[]
}