import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {generateRandomItem, getItemValue} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {Translations} from "../Translations";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {BlockingConstants} from "../constants/BlockingConstants";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {Maps} from "../maps/Maps";
import {callbackShopSmallEvent} from "../utils/SmallEventUtils";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Find a merchant who sells you a random item at a cheap price (or is it)
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(null, ItemConstants.RARITY.COMMON, SmallEventConstants.SHOP.MAX_RARITY);
		const multiplier = RandomUtils.draftbotRandom.bool(SmallEventConstants.SHOP.SCAM_PROBABILITY) ? SmallEventConstants.SHOP.SCAM_MULTIPLIER : SmallEventConstants.SHOP.BASE_MULTIPLIER;
		const price = Math.round(getItemValue(randomItem) * multiplier);
		const gender = RandomUtils.draftbotRandom.pick([0, 1]);
		const translationShop = Translations.getModule("smallEvents.shop", language);
		const endCallback = callbackShopSmallEvent(player, price, interaction, language, Translations.getModule("commands.shop", language), randomItem);
		await new DraftBotValidateReactionMessage(
			interaction.user,
			endCallback
		)
			.setAuthor({
				name: seEmbed.data.author.name,
				iconURL: interaction.user.displayAvatarURL()
			})
			.setDescription(seEmbed.data.description
				+ format(
					translationShop.getRandom(`intro.${gender}`)
					+ translationShop.get("end"), {
						name: translationShop.getRandom(`names.${gender}`),
						item: randomItem.toString(language, null),
						price,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[randomItem.getCategory()]} ${translationShop.get(`types.${randomItem.getCategory()}`)}`
					}))
			.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}
};