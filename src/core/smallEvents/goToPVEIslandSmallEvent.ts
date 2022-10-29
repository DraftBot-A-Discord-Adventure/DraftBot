import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {format} from "../utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {PVEConstants} from "../constants/PVEConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {MapLinks} from "../database/game/models/MapLink";

async function confirmationCallback(player: Player, msg: DraftBotValidateReactionMessage, tr: TranslationModule, emote: string): Promise<void> {
	await msg.sentMessage.channel.send({
		embeds: [
			new DraftBotEmbed()
				.setAuthor(msg.sentMessage.embeds[0].author)
				.setDescription(
					`${emote} ${msg.isValidated() ? tr.getRandom("endStoryAccept") : tr.get("endStoryRefuse")}`
				)
		]
	});
	if (msg.isValidated()) {
		await Maps.startTravel(
			player,
			await MapLinks.getById(PVEConstants.MAPS.ENTRY_LINK),
			Date.now(),
			NumberChangeReason.SMALL_EVENT
		);
	}
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND);
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	async canBeExecuted(player: Player): Promise<boolean> {
		return Maps.isNearWater(player) &&
			await PlayerSmallEvents.playerSmallEventCount(player.id, "goToPVEIsland") === 0;
	},

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.goToPVEIsland", language);
		const price = 0; // TODO price

		const confirmEmbed = new DraftBotValidateReactionMessage(
			interaction.user,
			(confirmMessage: DraftBotValidateReactionMessage) => {
				confirmationCallback(player, confirmMessage, tr, seEmbed.data.description).then();
			}
		);

		// Copy embed data
		Object.assign(confirmEmbed.data, seEmbed.data);

		confirmEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(tr.getRandom("stories"), {
				priceText: price === 0 ? tr.get("priceFree") : tr.get("priceMoney")
			}) +
			"\n\n" +
			tr.format("confirm", {
				fightPoints: await player.getCumulativeFightPoint(),
				fightPointsMax: await player.getMaxCumulativeFightPoint()
			})
		);

		await confirmEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND, collector));
	}
};