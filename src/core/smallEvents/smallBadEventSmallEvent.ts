import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {RandomUtils} from "../utils/RandomUtils";
import {Translations} from "../Translations";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {minutesDisplay} from "../utils/TimeUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {TravelTime} from "../maps/TravelTime";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Makes something bad happening to the player
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const outRand = RandomUtils.draftbotRandom.integer(0, 2);
		const translationSBE = Translations.getModule("smallEvents.smallBadEvent", language);
		const base = seEmbed.data.description + Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let lifeLoss, time, moneyLoss;
		switch (outRand) {
			case 0:
				lifeLoss = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.HEALTH);
				seEmbed.setDescription(
					base + format(translationSBE.getRandom("lifeLoss.stories"), {lifeLoss: lifeLoss})
				);
				await player.addHealth(-lifeLoss, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
				break;
			case 1:
				time = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.TIME) * 5;
				seEmbed.setDescription(
					base + format(translationSBE.getRandom("alteration.stories"), {alteTime: minutesDisplay(time)})
				);
				await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, time, new Date(), NumberChangeReason.SMALL_EVENT);
				break;
			default:
				moneyLoss = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.MONEY);
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
		await player.killIfNeeded(interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		await player.save();
	}
};