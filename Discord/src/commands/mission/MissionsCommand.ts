import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {draftBotClient, keycloakConfig} from "../../bot/DraftBotShard";
import {
	CommandMissionsPacketReq,
	CommandMissionsPacketRes
} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {User} from "discord.js";
import {MissionType} from "../../../../Lib/src/types/CompletedMission";
import {MissionUtils} from "../../utils/MissionUtils";
import {datesAreOnSameDay, finishInTimeDisplay, getTomorrowMidnight} from "../../../../Lib/src/utils/TimeUtils";
import {PacketUtils} from "../../utils/PacketUtils";

/**
 * Get the packet to send to the server
 * @param interaction
 * @param keycloakUser
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandMissionsPacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, keycloakUser);
	if (!askedPlayer) {
		return null;
	}
	return makePacket(CommandMissionsPacketReq, {askedPlayer});
}

/**
 * Handle the case where the player is not found
 * @param context
 */
export async function handleCommandMissionPlayerNotFoundPacket(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	await interaction?.reply({
		embeds: [
			new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))
		]
	});
}

/**
 * Get the campaign mission part of the missions command's response
 * @param packet
 * @param interaction
 */
function getCampaignMissionPart(packet: CommandMissionsPacketRes, interaction: DraftbotInteraction): string {
	const campaignMission = packet.missions.find(mission => mission.missionType === MissionType.CAMPAIGN);
	return `${i18n.t("commands:missions.subcategories.campaign", {
		lng: interaction.userLanguage,
		current: packet.campaignProgression,
		max: packet.maxCampaignNumber,
		context: campaignMission ? "current" : "completed"
	})}${campaignMission
		? `\n${i18n.t("commands:missions.missionDisplay", {
			lng: interaction.userLanguage,
			mission: MissionUtils.formatBaseMission(campaignMission, interaction.userLanguage),
			progressionBar: MissionUtils.generateDisplayProgression(campaignMission.numberDone, campaignMission.missionObjective),
			current: campaignMission.numberDone,
			objective: campaignMission.missionObjective,
			context: "campaign",
			interpolation: {escapeValue: false}
		})}`
		: ""
	}`;
}

/**
 * Get the daily mission part of the missions command's response
 * @param packet
 * @param interaction
 */
function getDailyMissionPart(packet: CommandMissionsPacketRes, interaction: DraftbotInteraction): string {
	const dailyMission = packet.missions.find(mission => mission.missionType === MissionType.DAILY)!;

	return `${i18n.t("commands:missions.subcategories.daily", {
		lng: interaction.userLanguage
	})}
${i18n.t(`commands:missions.${datesAreOnSameDay(
		new Date(), // Current date
		new Date(dailyMission.expiresAt ?? 0) // Date of the daily mission or 0 if it's not set
	) ? "dailyFinished" : "missionDisplay"}`, {
		lng: interaction.userLanguage,
		time: finishInTimeDisplay(getTomorrowMidnight()),
		mission: MissionUtils.formatBaseMission(dailyMission, interaction.userLanguage),
		progressionBar: MissionUtils.generateDisplayProgression(dailyMission.numberDone, dailyMission.missionObjective),
		current: dailyMission.numberDone,
		objective: dailyMission.missionObjective,
		context: "other",
		interpolation: {escapeValue: false}
	})}`;
}

/**
 * Get the side missions part of the missions command's response
 * @param packet
 * @param interaction
 */
function getSideMissionsPart(packet: CommandMissionsPacketRes, interaction: DraftbotInteraction): string {
	const sideMissions = packet.missions.filter(mission => mission.missionType === MissionType.NORMAL);
	return `${i18n.t("commands:missions.subcategories.sideMissions", {
		lng: interaction.userLanguage,
		current: sideMissions.length,
		max: packet.maxSideMissionSlots
	})}\n${sideMissions.length > 0
		? sideMissions.map(mission => i18n.t("commands:missions.missionDisplay", {
			lng: interaction.userLanguage,
			mission: MissionUtils.formatBaseMission(mission, interaction.userLanguage),
			progressionBar: MissionUtils.generateDisplayProgression(mission.numberDone, mission.missionObjective),
			current: mission.numberDone,
			objective: mission.missionObjective,
			time: finishInTimeDisplay(new Date(mission.expiresAt!)),
			context: "other",
			interpolation: {escapeValue: false}
		})).join("\n")
		: i18n.t("commands:missions.noCurrentMissions", {
			lng: interaction.userLanguage
		})}`;
}

/**
 * Handle the response of the missions command
 * @param packet
 * @param context
 */
export async function handleCommandMissionsPacketRes(packet: CommandMissionsPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (!interaction) {
		return;
	}
	const keycloakUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))!;
	if (!keycloakUser.attributes.discordId) {
		throw new Error(`User of keycloakId ${packet.keycloakId} has no discordId`);
	}
	const discordUser = draftBotClient.users.cache.get(keycloakUser.attributes.discordId[0]) as User;
	const missionCommandEmbed = new DraftBotEmbed();

	missionCommandEmbed.formatAuthor(i18n.t("commands:missions.title", {
		lng: interaction.userLanguage,
		pseudo: discordUser.displayName
	}), discordUser);

	missionCommandEmbed.setDescription([
		getCampaignMissionPart(packet, interaction),
		getDailyMissionPart(packet, interaction),
		getSideMissionsPart(packet, interaction)
	].join("\n"));
	await interaction?.reply({
		embeds: [missionCommandEmbed]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("missions")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("missions", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("missions", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};