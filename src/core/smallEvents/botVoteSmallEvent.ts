import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveRandomItem} from "../utils/ItemUtils";
import {Constants} from "../Constants";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.botVote", language);
		const base = seEmbed.description + " " + Translations.getModule("smallEventsIntros", language).getRandom("intro");

		if (await require("../DBL").getTimeBeforeDBLRoleRemove(entity.discordUserId) < 0) {
			// hasn't voted
			seEmbed.setDescription(base + tr.get("pleaseVote") + "\n\n" + tr.get("pleaseVoteFooter"));
			await interaction.reply({ embeds: [seEmbed] });

		}
		else if (RandomUtils.draftbotRandom.bool()) {
			// item win
			seEmbed.setDescription(base + tr.get("itemWin") + "\n\n" + tr.get("thanksFooter"));
			await interaction.reply({ embeds: [seEmbed] });
			await giveRandomItem(interaction.user, <TextChannel> interaction.channel, language, entity);
		}
		else {
			// money win
			const moneyWon = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_MONEY_WON_VOTE, Constants.SMALL_EVENT.MAXIMUM_MONEY_WON_VOTE);
			await entity.Player.addMoney(entity, moneyWon, <TextChannel> interaction.channel, language);
			seEmbed.setDescription(base + format(tr.get("moneyWin"), {money: moneyWon}) + "\n\n" + tr.get("thanksFooter"));
			await interaction.reply({ embeds: [seEmbed] });
		}
		await entity.Player.save();
		console.log(entity.discordUserId + " got botVote small event.");
	}
};