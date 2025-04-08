import { ReactionCollectorCreationPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import i18n from "../translations/i18n";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import { StringUtils } from "../utils/StringUtils";
import { DiscordCollectorUtils } from "../utils/DiscordCollectorUtils";
import { ReactionCollectorInteractOtherPlayersPoorData } from "../../../Lib/src/packets/interaction/ReactionCollectorInteractOtherPlayers";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../bot/DraftBotShard";
import { Language } from "../../../Lib/src/Language";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { EmoteUtils } from "../utils/EmoteUtils";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";

export async function interactOtherPlayerGetPlayerDisplay(keycloakId: string, rank: number | undefined, lng: Language): Promise<string> {
	const keycloakUser = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, keycloakId);
	const playerName = keycloakUser?.attributes.gameUsername ? keycloakUser.attributes.gameUsername : i18n.t("error:unknownPlayer", { lng });
	return rank
		? i18n.t("smallEvents:interactOtherPlayers.playerDisplayRanked", {
			lng,
			pseudo: playerName,
			rank
		})
		: i18n.t("smallEvents:interactOtherPlayers.playerDisplayUnranked", {
			lng,
			pseudo: playerName
		});
}

export async function interactOtherPlayersCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
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

	return await DiscordCollectorUtils.createAcceptRefuseCollector(
		interaction,
		embed,
		packet,
		context,
		{
			emojis: {
				accept: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.collectors.interactPoorCoin),
				refuse: DraftBotIcons.collectors.refuse
			}
		}
	);
}
