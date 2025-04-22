import {
	discordConfig, draftBotClient, keycloakConfig
} from "../bot/DraftBotShard";
import { TextChannel } from "discord.js";
import i18n from "../translations/i18n";
import { TopWeekAnnouncementPacket } from "../../../Lib/src/packets/announcements/TopWeekAnnouncementPacket";
import { LANGUAGE } from "../../../Lib/src/Language";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { TopWeekFightAnnouncementPacket } from "../../../Lib/src/packets/announcements/TopWeekFightAnnouncementPacket";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { DraftBotLogger } from "../../../Lib/src/logs/DraftBotLogger";
import { escapeUsername } from "../utils/StringUtils";

export abstract class DiscordAnnouncement {
	private static async announceTop(messageFr: string, messageEn: string): Promise<void> {
		try {
			const frenchChannel = await draftBotClient!.channels.fetch(discordConfig.FRENCH_ANNOUNCEMENT_CHANNEL_ID);
			await (await (frenchChannel as TextChannel).send({ content: messageFr })).react(DraftBotIcons.announcements.trophy);
		}
		catch (e) {
			DraftBotLogger.errorWithObj("Error while sending top announcement in french channel", e);
		}
		try {
			const englishChannel = await draftBotClient!.channels.fetch(discordConfig.ENGLISH_ANNOUNCEMENT_CHANNEL_ID);
			await (await (englishChannel as TextChannel).send({ content: messageEn })).react(DraftBotIcons.announcements.trophy);
		}
		catch (e) {
			DraftBotLogger.errorWithObj("Error while sending top announcement in english channel", e);
		}
	}

	static async canAnnounce(): Promise<boolean> {
		const guild = await draftBotClient!.guilds.fetch(discordConfig.MAIN_SERVER_ID);
		return Boolean(guild.shard);
	}

	static async announceTopWeek(topWeekAnnouncementPacket: TopWeekAnnouncementPacket): Promise<void> {
		DraftBotLogger.info("Announcing top week...");
		if (topWeekAnnouncementPacket.winnerKeycloakId) {
			const winner = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, topWeekAnnouncementPacket.winnerKeycloakId);
			if (winner) {
				const mention = winner.attributes.discordId ? `<@${winner.attributes.discordId[0]}>` : escapeUsername(winner.attributes.gameUsername[0]);
				const messageFr = i18n.t("bot:topWeekAnnouncement", {
					lng: LANGUAGE.FRENCH,
					mention
				});
				const messageEn = i18n.t("bot:topWeekAnnouncement", {
					lng: LANGUAGE.ENGLISH,
					mention
				});
				await this.announceTop(messageFr, messageEn);
			}
			else {
				DraftBotLogger.error(`Failed to announce top week: winner with keycloak id ${topWeekAnnouncementPacket.winnerKeycloakId} not found`);
			}
		}
		else {
			const messageFr = i18n.t("bot:topWeekAnnouncementNoWinner", { lng: LANGUAGE.FRENCH });
			const messageEn = i18n.t("bot:topWeekAnnouncementNoWinner", { lng: LANGUAGE.ENGLISH });
			await this.announceTop(messageFr, messageEn);
		}
	}

	static async announceTopWeekFight(topWeekFightAnnouncementPacket: TopWeekFightAnnouncementPacket): Promise<void> {
		DraftBotLogger.info("Announcing fight top week...");
		if (topWeekFightAnnouncementPacket.winnerKeycloakId) {
			const winner = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, topWeekFightAnnouncementPacket.winnerKeycloakId);
			if (winner) {
				const mention = winner.attributes.discordId ? `<@${winner.attributes.discordId[0]}>` : escapeUsername(winner.attributes.gameUsername[0]);
				const messageFr = i18n.t("bot:seasonEndAnnouncement", {
					lng: LANGUAGE.FRENCH,
					mention
				});
				const messageEn = i18n.t("bot:seasonEndAnnouncement", {
					lng: LANGUAGE.ENGLISH,
					mention
				});
				await this.announceTop(messageFr, messageEn);
			}
			else {
				DraftBotLogger.error(`Failed to announce top week fight: winner with keycloak id ${topWeekFightAnnouncementPacket.winnerKeycloakId} not found`);
			}
		}
		else {
			const messageFr = i18n.t("bot:seasonEndAnnouncementNoWinner", { lng: LANGUAGE.FRENCH });
			const messageEn = i18n.t("bot:seasonEndAnnouncementNoWinner", { lng: LANGUAGE.ENGLISH });
			await this.announceTop(messageFr, messageEn);
		}
	}
}
