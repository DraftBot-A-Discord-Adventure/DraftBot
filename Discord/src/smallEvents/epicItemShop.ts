import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {ReactionCollectorMerchantData} from "../../../Lib/src/packets/interaction/ReactionCollectorMerchant";
import {DisplayUtils} from "../utils/DisplayUtils";
import {Constants} from "../../../Lib/src/constants/Constants";
import i18n from "../translations/i18n";

/**
 * Send the initial embed for this small event
 * @param packet
 * @param context
 */
export async function epicItemShopCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorMerchantData;
	const tip = data.tip ? StringUtils.getRandomTranslation("smallEvents:epicItemShop.reductionTip",interaction.userLanguage) : "";

	const embed = new DraftbotSmallEventEmbed(
		"epicItemShop",
		StringUtils.getRandomTranslation("smallEvents:epicItemShop.intro", interaction.userLanguage)
		+ tip
		+ StringUtils.getRandomTranslation("smallEvents:shop.end", interaction.userLanguage, {
			item: DisplayUtils.getItemDisplayWithStats(data.item, interaction.userLanguage),
			price: data.price,
			type: `${Constants.REACTIONS.ITEM_CATEGORIES[data.item.category]}${i18n.t("smallEvents:shop.types", {
				returnObjects: true,
				lng: interaction.userLanguage
			})[data.item.category]}`,
			interpolation: {escapeValue: false}
		}),
		interaction.user,
		interaction.userLanguage
	);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function epicItemShopHandler(context: PacketContext, translationKey: string): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftbotSmallEventEmbed(
				"epicItemShop",
				StringUtils.getRandomTranslation(translationKey, originalInteraction.userLanguage),
				buttonInteraction.user,
				originalInteraction.userLanguage
			)
		]
	});
}