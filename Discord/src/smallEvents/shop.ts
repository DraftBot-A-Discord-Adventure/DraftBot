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

export async function shopCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorMerchantData;
	const gender = RandomUtils.draftbotRandom.bool() ? "m" : "f";
	const name = StringUtils.getRandomTranslation("smallEvents:shop.names", interaction.userLanguage, {context: gender});

	const embed = new DraftbotSmallEventEmbed(
		"shop",
		StringUtils.getRandomTranslation("smallEvents:shop.intro", interaction.userLanguage, {context: gender, name})
		+ StringUtils.getRandomTranslation("smallEvents:shop.end", interaction.userLanguage, {
			item: DisplayUtils.getItemDisplayWithStats(data.item,interaction.userLanguage),
			price: data.price,
			type: data.item.category
		}),
		interaction.user,
		interaction.userLanguage
	);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function shopResult(packet: SmallEventShopPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);

	/* TODO : Renvoyer une réponse/Trouver les textes ?? */
}