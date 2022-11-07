import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {RandomUtils} from "../utils/RandomUtils";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {minutesDisplay} from "../utils/TimeUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {TravelTime} from "../maps/TravelTime";
import Player from "../database/game/models/Player";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Makes something bad happening to the player
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const outRand = RandomUtils.draftbotRandom.integer(0, 2);
		const translationSBE = Translations.getModule("smallEvents.smallBadEvent", language);
		const base = seEmbed.data.description + Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let lifeLoss, time, moneyLoss;
		switch (outRand) {
		case 0:
			lifeLoss = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_HEALTH_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_HEALTH_LOST_SMALL);
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("lifeLoss.stories"), {lifeLoss: lifeLoss})
			);
			await player.addHealth(-lifeLoss, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
			break;
		case 1:
			time = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_TIME_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_TIME_LOST_SMALL) * 5;
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("alteration.stories"), {alteTime: minutesDisplay(time)})
			);
			await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, time, interaction.createdAt, NumberChangeReason.SMALL_EVENT, interaction.createdAt);
			break;
		default:
			moneyLoss = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_MONEY_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_MONEY_LOST_SMALL);
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("moneyLoss.stories"), {moneyLost: moneyLoss})
			);
			await player.addMoney({
				amount: -moneyLoss,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			break;
		}
		await interaction.editReply({embeds: [seEmbed]});
		await player.killIfNeeded(interaction.channel, language, NumberChangeReason.SMALL_EVENT, interaction.createdAt);
		await player.save();
	}
};