import { ReactionCollectorCreationPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import i18n from "../translations/i18n";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import {
	escapeUsername, StringUtils
} from "../utils/StringUtils";
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
	return i18n.t(`smallEvents:interactOtherPlayers.playerDisplay${rank ? "Ranked" : "Unranked"}`, {
		lng,
		pseudo: escapeUsername(keycloakUser?.attributes.gameUsername ? keycloakUser.attributes.gameUsername[0] : i18n.t("error:unknownPlayer", { lng })),
		rank
	});
}

export async function interactOtherPlayersCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const lng = interaction.userLanguage;
	const data = packet.data.data as ReactionCollectorInteractOtherPlayersPoorData;
	const playerDisplay = await interactOtherPlayerGetPlayerDisplay(data.keycloakId, data.rank, lng);

	const embed = new DraftbotSmallEventEmbed(
		"interactOtherPlayers",
		StringUtils.getRandomTranslation(
			"smallEvents:interactOtherPlayers.poor",
			lng,
			{ playerDisplay }
		),
		interaction.user,
		lng
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
