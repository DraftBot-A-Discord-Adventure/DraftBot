import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {giveRandomItem} from "../utils/ItemUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {DBL} from "../DBL";
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
	 * Gives a reward to those who voted, and shows where to vote if you haven't voted
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.botVote", language);
		const base = `${seEmbed.data.description} ${Translations.getModule("smallEventsIntros", language).getRandom("intro")}${tr.getRandom("stories")}`;

		if (await DBL.getTimeBeforeDBLRoleRemove(player.discordUserId) < 0) {
			// Hasn't voted
			seEmbed.setDescription(`${base + tr.get("pleaseVote")}\n\n${tr.get("pleaseVoteFooter")}`);
			await interaction.editReply({embeds: [seEmbed]});

		}
		else if (RandomUtils.draftbotRandom.bool()) {
			// Item win
			seEmbed.setDescription(`${base + tr.get("itemWin")}\n\n${tr.get("thanksFooter")}`);
			await interaction.editReply({embeds: [seEmbed]});
			await giveRandomItem(interaction.user, interaction.channel, language, player);
		}
		else {
			// Money win
			const moneyWon = RandomUtils.rangedInt(SmallEventConstants.VOTE.MONEY);
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