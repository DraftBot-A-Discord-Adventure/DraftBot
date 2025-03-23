import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {SmallEventCartPacket} from "../../../Lib/src/packets/smallEvents/SmallEventCartPacket";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {EmoteUtils} from "../utils/EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import {ReactionCollectorCartData} from "../../../Lib/src/packets/interaction/ReactionCollectorCart";
import {ReactionCollectorReturnType} from "../packetHandlers/handlers/ReactionCollectorHandlers";

export async function cartCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorCartData;
	const story = data.displayedDestination.isDisplayed ? "knownDestination" : "unknownDestination";
	const lng = interaction!.userLanguage;

	const embed = new DraftbotSmallEventEmbed(
		"cart",
		getRandomSmallEventIntro(lng)
		+ StringUtils.getRandomTranslation(`smallEvents:cart.${story}`, lng, {
			price: data.price,
			moneyEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.unitValues.money),
			destination:
				`${DraftBotIcons.map_types[data.displayedDestination.type!]} ${
					i18n.t(`models:map_locations.${data.displayedDestination.id}.name`, {lng})
				}`
		})
		+ StringUtils.getRandomTranslation("smallEvents:cart.menu", lng),
		interaction.user,
		lng
	);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, {
		emojis: {
			accept: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.cart_small_event.accept),
			refuse: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.cart_small_event.refuse)
		}
	});
}

export async function cartResult(packet: SmallEventCartPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);

	let story;
	if (!packet.travelDone.hasEnoughMoney && packet.travelDone.isAccepted) {
		story = "notEnoughMoney";
	}

	else if (!packet.travelDone.isAccepted) {
		story = "travelRefused";
	}

	else {
		story = packet.isScam ? "scamTravelDone" : packet.isDisplayed ? "normalTravelDone" : "unknownDestinationTravelDone";
	}

	if (interaction) {
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"cart",
					StringUtils.getRandomTranslation(`smallEvents:cart.${story}`, user.attributes.language[0]),
					interaction.user,
					user.attributes.language[0]
				)
			]
		});
	}
}