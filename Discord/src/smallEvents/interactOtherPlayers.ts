import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import i18n from "../translations/i18n";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import { ReactionCollectorInteractOtherPlayersPoorData } from "../../../Lib/src/packets/interaction/ReactionCollectorInteractOtherPlayers";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {Language} from "../../../Lib/src/Language";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";

export async function interactOtherPlayerGetPlayerDisplay(keycloakId: string, rank: number | undefined, language: Language): Promise<string> {
	const keycloakUser = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, keycloakId);
	const playerName = keycloakUser && keycloakUser.attributes.gameUsername ? keycloakUser.attributes.gameUsername : i18n.t("error:unknownPlayer", {lng: language});
	return rank
		? i18n.t("smallEvents:interactOtherPlayers.playerDisplayRanked", {lng: language, pseudo: playerName, rank })
		: i18n.t("smallEvents:interactOtherPlayers.playerDisplayUnranked", {lng: language, pseudo: playerName });
}

export async function interactOtherPlayersCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorInteractOtherPlayersPoorData;
	const playerDisplay = await interactOtherPlayerGetPlayerDisplay(data.keycloakId, data.rank, interaction.userLanguage);

	const embed = new DraftbotSmallEventEmbed(
		"interactOtherPlayers",
		StringUtils.getRandomTranslation(
			"smallEvents:interactOtherPlayers.poor",
			interaction.userLanguage,
			{
				playerDisplay
			}
		),
		interaction.user,
		interaction.userLanguage
	);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, DraftBotIcons.collectors.interactPoorCoin);
}