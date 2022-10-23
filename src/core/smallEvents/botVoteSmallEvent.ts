import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveRandomItem} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {DBL} from "../DBL";
import Player from "../database/game/models/Player";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Gives a reward to those who voted, and shows where to vote if you haven't voted
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.botVote", language);
		const base = `${seEmbed.data.description} ${Translations.getModule("smallEventsIntros", language).getRandom("intro")}${tr.getRandom("stories")}`;

		if (await DBL.getTimeBeforeDBLRoleRemove(player.discordUserId) < 0) {
			// hasn't voted
			seEmbed.setDescription(`${base + tr.get("pleaseVote")}\n\n${tr.get("pleaseVoteFooter")}`);
			await interaction.editReply({embeds: [seEmbed]});

		}
		else if (RandomUtils.draftbotRandom.bool()) {
			// item win
			seEmbed.setDescription(`${base + tr.get("itemWin")}\n\n${tr.get("thanksFooter")}`);
			await interaction.editReply({embeds: [seEmbed]});
			await giveRandomItem(interaction.user, interaction.channel, language, player);
		}
		else {
			// money win
			const moneyWon = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_MONEY_WON_VOTE, Constants.SMALL_EVENT.MAXIMUM_MONEY_WON_VOTE);
			await player.addMoney({
				amount: moneyWon,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			seEmbed.setDescription(`${base + format(tr.get("moneyWin"), {money: moneyWon})}\n\n${tr.get("thanksFooter")}`);
			await interaction.editReply({embeds: [seEmbed]});
		}
		await player.save();
	}
};