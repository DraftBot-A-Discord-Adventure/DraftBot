import {
	DraftBotPacket, PacketContext
} from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordMQTT } from "../bot/DiscordMQTT";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import {
	discordConfig, keycloakConfig
} from "../bot/DraftBotShard";
import { DraftBotErrorEmbed } from "../messages/DraftBotErrorEmbed";
import i18n from "../translations/i18n";
import { DraftbotInteraction } from "../messages/DraftbotInteraction";
import { KeycloakUser } from "../../../Lib/src/keycloak/KeycloakUser";
import { MqttTopicUtils } from "../../../Lib/src/utils/MqttTopicUtils";
import { MessageFlags } from "discord-api-types/v10";

export type AskedPlayer = {
	keycloakId?: string;
	rank?: number;
};

export abstract class PacketUtils {
	static sendPacketToBackend(context: PacketContext, packet: DraftBotPacket): void {
		DiscordMQTT.globalMqttClient!.publish(MqttTopicUtils.getCoreTopic(discordConfig.PREFIX), JSON.stringify({
			packet: {
				name: packet.constructor.name,
				data: packet
			},
			context
		}));
	}

	/**
	 * Prepare the asked player from the draftbot interaction
	 * @param interaction
	 * @param keycloakUser
	 */
	static async prepareAskedPlayer(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<AskedPlayer | null> {
		let askedPlayer: AskedPlayer = { keycloakId: keycloakUser.id };

		const user = interaction.options.getUser("user");
		if (user) {
			const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName);
			if (!keycloakId) {
				await interaction.reply({
					embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", { lng: interaction.userLanguage }))],
					flags: MessageFlags.Ephemeral
				});
				return null;
			}
			askedPlayer = { keycloakId };
		}
		const rank = interaction.options.get("rank");
		if (rank) {
			askedPlayer = { rank: <number>rank.value };
		}
		return askedPlayer;
	}
}
