import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {ReactionCollectorMerchantData} from "../../../Lib/src/packets/interaction/ReactionCollectorMerchant";
import {RandomUtils} from "../../../Lib/src/utils/RandomUtils";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {SmallEventShopPacket} from "../../../Lib/src/packets/smallEvents/SmallEventShopPacket";
import {DisplayUtils} from "../utils/DisplayUtils";
import {Constants} from "../../../Lib/src/constants/Constants";
import i18n from "../translations/i18n";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {ButtonInteraction} from "discord.js";
import {SmallEventConstants} from "../../../Lib/src/constants/SmallEventConstants";

/**
 * Send the initial embed for this small event
 * @param packet
 * @param context
 */
export async function smallShopCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorMerchantData;
	const gender = RandomUtils.draftbotRandom.bool() ? SmallEventConstants.SHOP.MALE_MERCHANT : SmallEventConstants.SHOP.FEMALE_MERCHANT;
	const name = StringUtils.getRandomTranslation("smallEvents:shop.names", interaction.userLanguage, {context: gender});

	const embed = new DraftbotSmallEventEmbed(
		"shop",
		StringUtils.getRandomTranslation("smallEvents:shop.intro", interaction.userLanguage, {context: gender, name})
		+ StringUtils.getRandomTranslation("smallEvents:shop.end", interaction.userLanguage, {
			item: DisplayUtils.getItemDisplayWithStats(data.item,interaction.userLanguage),
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

/**
 * Handle when the user accepts
 * @param user
 * @param interaction
 * @param packet
 */
export async function handleAcceptReaction(user: KeycloakUser, interaction: ButtonInteraction | null, packet: SmallEventShopPacket): Promise<void> {
	if (interaction) {
		if (!packet.canBuy) {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"shop",
						StringUtils.getRandomTranslation("smallEvents:shop.notEnoughMoney", user.attributes.language[0]),
						interaction.user,
						user.attributes.language[0]
					)
				]
			});
		}
		else {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"shop",
						StringUtils.getRandomTranslation("smallEvents:shop.purchased", user.attributes.language[0]),
						interaction.user,
						user.attributes.language[0]
					)
				]
			});
		}
	}
}

/**
 * Handle when the user refuses
 * @param user
 * @param interaction
 */
export async function handleRefuseReaction(user: KeycloakUser, interaction: ButtonInteraction | null): Promise<void> {
	if (interaction) {
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"shop",
					StringUtils.getRandomTranslation("smallEvents:shop.refused", user.attributes.language[0]),
					interaction.user,
					user.attributes.language[0]
				)
			]
		});
	}
}

/**
 * Send the final embed of this small event
 * @param packet
 * @param context
 */
export async function smallShopResult(packet: SmallEventShopPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);

	if (packet.isValidated) {
		await handleAcceptReaction(user, interaction, packet);
	}
	else {
		await handleRefuseReaction(user, interaction);
	}
}