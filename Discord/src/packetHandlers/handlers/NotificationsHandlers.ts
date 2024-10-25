import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {CommandReportChooseDestinationRes} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {minutesToHours} from "../../../../Lib/src/utils/TimeUtils";
import {GuildLevelUpPacket} from "../../../../Lib/src/packets/notifications/GuildLevelUpPacket";
import {MissionsCompletedPacket} from "../../../../Lib/src/packets/notifications/MissionsCompletedPacket";
import {MissionsExpiredPacket} from "../../../../Lib/src/packets/notifications/MissionsExpiredPacket";
import {PlayerDeathPacket} from "../../../../Lib/src/packets/notifications/PlayerDeathPacket";
import {PlayerLeavePveIslandPacket} from "../../../../Lib/src/packets/notifications/PlayerLeavePveIslandPacket";
import {PlayerLevelUpPacket} from "../../../../Lib/src/packets/notifications/PlayerLevelUpPacket";
import {PlayerReceivePetPacket} from "../../../../Lib/src/packets/notifications/PlayerReceivePetPacket";
import {EmoteUtils} from "../../utils/EmoteUtils";

export default class NotificationsHandlers {
	@packetHandler(CommandReportChooseDestinationRes)
	async chooseDestinationRes(packet: CommandReportChooseDestinationRes, context: PacketContext): Promise<void> {
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
				i18nTr = "commands:report.choseMapMinutes";
			}
			else {
				time = Math.round(minutesToHours(packet.tripDuration));
				i18nTr = "commands:report.choseMap";
			}
			embed.setDescription(i18n.t(i18nTr, {
				count: time,
				lng: interaction.userLanguage,
				mapPrefix: i18n.t(`models:map_types.${packet.mapTypeId}.prefix`, {lng: interaction.userLanguage}),
				mapType: (i18n.t(`models:map_types.${packet.mapTypeId}.name`, {lng: interaction.userLanguage}) as string).toLowerCase(),
				mapEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.map_types[packet.mapTypeId]),
				mapName: i18n.t(`models:map_locations.${packet.mapId}.name`, {lng: interaction.userLanguage}),
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

	@packetHandler(GuildLevelUpPacket)
	async guildLevelUp(packet: GuildLevelUpPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(MissionsCompletedPacket)
	async missionsCompleted(packet: MissionsCompletedPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(MissionsExpiredPacket)
	async missionsExpired(packet: MissionsExpiredPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerDeathPacket)
	async playerDeath(packet: PlayerDeathPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerLeavePveIslandPacket)
	async playerLeavePveIsland(packet: PlayerLeavePveIslandPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerLevelUpPacket)
	async playerLevelUp(packet: PlayerLevelUpPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerReceivePetPacket)
	async playerReceivePet(packet: PlayerReceivePetPacket, context: PacketContext): Promise<void> {
		// Todo
	}


}