import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {SmallEventCartPacket} from "../../../Lib/src/packets/smallEvents/SmallEventCartPacket";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";

export async function cartCollector(packet: ReactionCollectorCreationPacket, context: PacketContext, embed: DraftBotEmbed): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function cartResult(packet: SmallEventCartPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);

	let story;
	if (!packet.travelDone.hasEnoughMoney) {
		story = "notEnoughMoney";
	}

	else if (!packet.travelDone.isAccepted) {
		story = "travelRefused";
	}

	else {
		story = packet.isScam ? "scamTravelDone" : packet.displayedDestination.isDisplayed ? "normalTravelDone" : "unknownDestinationTravelDone";
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