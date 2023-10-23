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
import {Maps} from "../maps/Maps";
import {callbackShopSmallEvent} from "../utils/SmallEventUtils";
import {ItemConstants} from "../constants/ItemConstants";
import {MapConstants} from "../constants/MapConstants";


/**
 * Make all the calculations to generate the multiplier to use for the price of the item
 * @param player
 */
async function generateMultiplier(player: Player): Promise<number> {
	const destination = await player.getDestination();
	const origin = await player.getPreviousMap();
	let multiplier = RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_PROBABILITY) ?
		SmallEventConstants.EPIC_ITEM_SHOP.GREAT_DEAL_MULTIPLAYER : SmallEventConstants.EPIC_ITEM_SHOP.BASE_MULTIPLIER;
	if (destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS || origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS) {
		multiplier = SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER;
	}
	return multiplier;
}

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
		const randomItem = await generateRandomItem(
			RandomUtils.draftbotRandom.pick(
				Object.values(ItemConstants.CATEGORIES).filter((category) => category !== ItemConstants.CATEGORIES.POTION)
			),
			SmallEventConstants.EPIC_ITEM_SHOP.MIN_RARITY,
			SmallEventConstants.EPIC_ITEM_SHOP.MAX_RARITY
		);

		const multiplier = await generateMultiplier(player);
		const price = Math.round(getItemValue(randomItem) * multiplier);

		const translationShop = Translations.getModule("smallEvents.epicItemShop", language);
		const endCallback = callbackShopSmallEvent(player, price, interaction, language, Translations.getModule("commands.shop", language), randomItem);
		const reductionTip = RandomUtils.draftbotRandom.bool(SmallEventConstants.EPIC_ITEM_SHOP.REDUCTION_TIP_PROBABILITY) && multiplier > SmallEventConstants.EPIC_ITEM_SHOP.ROAD_OF_WONDERS_MULTIPLIER
			? translationShop.get("reductionTip")
			: "";
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
					translationShop.getRandom("intro")
					+ reductionTip
					+ translationShop.get("end"), {
						item: randomItem.toString(language, null),
						price,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[randomItem.getCategory()]} ${translationShop.get(`types.${randomItem.getCategory()}`)}`
					}))
			.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}
};