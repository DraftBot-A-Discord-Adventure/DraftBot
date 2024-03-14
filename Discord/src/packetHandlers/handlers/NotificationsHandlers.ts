import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {CommandReportChooseDestinationRes} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {minutesToHours} from "../../../../Lib/src/utils/TimeUtils";

export default class NotificationsHandlers {
	@packetHandler(CommandReportChooseDestinationRes)
	async chooseDestinationRes(socket: WebSocket, packet: CommandReportChooseDestinationRes, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (interaction) {
			const embed = new DraftBotEmbed();
			embed.formatAuthor(i18n.t("commands:report.destinationTitle", {
				lng: interaction.userLanguage,
				pseudo: user.attributes.gameUsername
			}), interaction.user);

			let time = packet.tripDuration;
			let i18nTr: string;
			if (time < 60) {
				i18nTr = time === 1 ? "commands:report.choseMapMinutes_one" : "commands:report.choseMapMinutes_other";
			}
			else {
				time = Math.round(minutesToHours(packet.tripDuration));
				i18nTr = time === 1 ? "commands:report.choseMap_one" : "commands:report.choseMap_other";
			}
			embed.setDescription(i18n.t(i18nTr, {
				lng: interaction.userLanguage,
				mapPrefix: i18n.t(`models:map_types.${packet.mapTypeId}.prefix`, { lng: interaction.userLanguage }),
				mapType: (i18n.t(`models:map_types.${packet.mapTypeId}.name`, { lng: interaction.userLanguage }) as string).toLowerCase(),
				mapEmote: DraftBotIcons.map_types[packet.mapTypeId],
				mapName: i18n.t(`models:map_locations.${packet.mapId}.name`, { lng: interaction.userLanguage }),
				time
			}));

			if (context.discord?.buttonInteraction) {
				await DiscordCache.getButtonInteraction(context.discord?.buttonInteraction)?.editReply({embeds: [embed]});
			}
			else {
				await interaction?.channel.send({embeds: [embed]});
			}
		}
	}
}