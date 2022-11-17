import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {minutesDisplay} from "../utils/TimeUtils";
import {MissionsController} from "../missions/MissionsController";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {TravelTime} from "../maps/TravelTime";
import Player from "../database/game/models/Player";
import {EffectType, LanguageType} from "../constants/TypeConstants";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Make something terrible happening to the player
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: LanguageType, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const outRand = RandomUtils.draftbotRandom.integer(0, 2);
		const transIntroSE = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const tr = Translations.getModule("smallEvents.bigBadEvent", language);
		const base = seEmbed.data.description + transIntroSE;
		const alterationObject = tr.getObject("alteration.stories");
		let lifeLoss, seFallen, moneyLoss;
		switch (outRand) {
		case 0:
			lifeLoss = RandomUtils.rangedInt(SmallEventConstants.BIG_BAD.HEALTH);
			seEmbed.setDescription(base + format(tr.getRandom("lifeLoss.stories"), {lifeLoss: lifeLoss}));
			await player.addHealth(-lifeLoss, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
			break;
		case 1:
			seFallen = alterationObject[RandomUtils.randInt(0, alterationObject.length)];
			seEmbed.setDescription(base + format(seFallen.sentence as string, {
				alteTime: minutesDisplay(EffectsConstants.DURATION[seFallen.alte as keyof typeof EffectsConstants.DURATION]),
				alteEmoji: seFallen.alte as string
			}));
			await TravelTime.applyEffect(player, seFallen.alte as EffectType, 0, interaction.createdAt, NumberChangeReason.SMALL_EVENT);
			if (seFallen.tags) {
				for (let i = 0; i < (seFallen.tags as string[]).length; i++) {
					await MissionsController.update(player, interaction.channel, language, {
						missionId: (seFallen.tags as string[])[i],
						params: {tags: seFallen.tags}
					});
				}
			}
			break;
		default:
			moneyLoss = RandomUtils.rangedInt(SmallEventConstants.BIG_BAD.MONEY);
			seEmbed.setDescription(base + format(tr.getRandom("moneyLoss.stories"), {moneyLost: moneyLoss}));
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