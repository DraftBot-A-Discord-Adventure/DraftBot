import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Maps} from "../Maps";
import {format} from "../utils/StringFormatter";
import {RandomUtils} from "../utils/RandomUtils";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {minutesDisplay} from "../utils/TimeUtils";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const outRand = RandomUtils.draftbotRandom.integer(0, 2);
		const translationSBE = Translations.getModule("smallEvents.smallBadEvent", language);
		const base = seEmbed.description + Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let lifeLoss, time, moneyLoss;
		switch (outRand) {
		case 0:
			lifeLoss = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_HEALTH_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_HEALTH_LOST_SMALL);
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("lifeLoss.stories"), {lifeLoss: lifeLoss})
			);
			await entity.addHealth(-lifeLoss, interaction.channel, language);
			break;
		case 1:
			time = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_TIME_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_TIME_LOST_SMALL) * 5;
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("alteration.stories"), {alteTime: minutesDisplay(time)})
			);
			await Maps.applyEffect(entity.Player, Constants.EFFECT.OCCUPIED, time);
			break;
		default:
			moneyLoss = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_MONEY_LOST_SMALL,
				Constants.SMALL_EVENT.MAXIMUM_MONEY_LOST_SMALL);
			seEmbed.setDescription(
				base + format(translationSBE.getRandom("moneyLoss.stories"), {moneyLost: moneyLoss})
			);
			await entity.Player.addMoney(entity, -moneyLoss, interaction.channel, language);
			break;
		}
		await interaction.reply({embeds: [seEmbed]});
		console.log(entity.discordUserId + " got small bad event.");
		await entity.Player.killIfNeeded(entity, interaction.channel, language);
		await entity.Player.save();
		await entity.save();
	}
};