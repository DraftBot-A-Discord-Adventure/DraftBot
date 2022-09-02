import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {generateRandomItem, getItemValue, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {TranslationModule, Translations} from "../Translations";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {sendErrorMessage} from "../utils/ErrorUtils";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

/**
 * Get the callback of the shop small event
 * @param entity
 * @param price
 * @param interaction
 * @param language
 * @param translationShop
 * @param randomItem
 */
function callbackShopSmallEvent(
	entity: Entity,
	price: number,
	interaction: CommandInteraction,
	language: string,
	translationShop: TranslationModule,
	randomItem: GenericItemModel): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.MERCHANT);
		if (msg.isValidated()) {
			if (entity.Player.money < price) {
				await sendErrorMessage(interaction.user, interaction, language,
					translationShop.format("error.cannotBuy", {
						missingMoney: price - entity.Player.money
					})
				);
				return;
			}
			await giveItemToPlayer(entity, randomItem, language, interaction.user, interaction.channel, Constants.SMALL_EVENT.SHOP_RESALE_MULTIPLIER, 1);
			await entity.Player.addMoney({
				entity,
				amount: -price,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await entity.Player.save();
			return;
		}
		await sendErrorMessage(interaction.user, interaction, language,
			Translations.getModule("commands.shop", language).get("error.canceledPurchase"), true
		);
	};
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Find a merchant who sells you a random item at a cheap price (or is it)
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(Constants.RARITY.SPECIAL);
		const multiplier = RandomUtils.randInt(1, 11) === 10 ? 5 : 0.6;
		const price = Math.round(getItemValue(randomItem) * multiplier);
		const gender = RandomUtils.draftbotRandom.pick([0, 1]);
		const translationShop = Translations.getModule("smallEvents.shop", language);
		const endCallback = callbackShopSmallEvent(entity, price, interaction, language, Translations.getModule("commands.shop", language), randomItem);
		await new DraftBotValidateReactionMessage(
			interaction.user,
			endCallback
		)
			.setAuthor({
				name: seEmbed.author.name,
				iconURL: interaction.user.displayAvatarURL()
			})
			.setDescription(seEmbed.description
				+ format(
					translationShop.getRandom(`intro.${gender}`)
					+ translationShop.get("end"), {
						name: translationShop.getRandom(`names.${gender}`),
						item: randomItem.toString(language, null),
						price: price,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[randomItem.getCategory()]} ${translationShop.get(`types.${randomItem.getCategory()}`)}`
					}))
			.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}
};