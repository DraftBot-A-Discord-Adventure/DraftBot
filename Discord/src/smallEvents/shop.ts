import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {ReactionCollectorMerchantData} from "../../../Lib/src/packets/interaction/ReactionCollectorMerchant";
import {RandomUtils} from "../../../Lib/src/utils/RandomUtils";
import {DisplayUtils} from "../utils/DisplayUtils";
import {Constants} from "../../../Lib/src/constants/Constants";
import i18n from "../translations/i18n";
import {StringConstants} from "../../../Lib/src/constants/StringConstants";

/**
 * Send the initial embed for this small event
 * @param packet
 * @param context
 */
export async function smallShopCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorMerchantData;
	const gender = RandomUtils.draftbotRandom.bool() ? StringConstants.SEX.MALE : StringConstants.SEX.FEMALE;
	const name = StringUtils.getRandomTranslation("smallEvents:shop.names", interaction.userLanguage, {context: gender.short});

	const embed = new DraftbotSmallEventEmbed(
		"shop",
		StringUtils.getRandomTranslation("smallEvents:shop.intro", interaction.userLanguage, {
			context: gender.short,
			name
		})
		+ StringUtils.getRandomTranslation("smallEvents:shop.end", interaction.userLanguage, {
			item: DisplayUtils.getItemDisplayWithStats(data.item, interaction.userLanguage),
			price: data.price,
			type: `${Constants.REACTIONS.ITEM_CATEGORIES[data.item.category]}${i18n.t("smallEvents:shop.types", {
				returnObjects: true,
				lng: interaction.userLanguage,
				interpolation: {escapeValue: false}
			})[data.item.category]}`
		}),
		interaction.user,
		interaction.userLanguage
	);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function baseFunctionHandler(context: PacketContext, translationKey: string): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	await interaction?.followUp({
		embeds: [
			new DraftbotSmallEventEmbed(
				"shop",
				StringUtils.getRandomTranslation(translationKey, interaction.userLanguage),
				interaction.user,
				interaction.userLanguage
			)
		]
	});
}