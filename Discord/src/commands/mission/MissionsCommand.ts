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
	CommandMissionPlayerNotFoundPacket,
	CommandMissionsPacketReq,
	CommandMissionsPacketRes
} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {User} from "discord.js";
import {MissionType} from "../../../../Lib/src/interfaces/CompletedMission";
import {MissionUtils} from "../../utils/MissionUtils";
import {datesAreOnSameDay, finishInTimeDisplay, getTomorrowMidnight} from "../../../../Lib/src/utils/TimeUtils";

async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandMissionsPacketReq | null> {
	let askedPlayer: {
		keycloakId?: string,
		rank?: number
	} = {keycloakId: keycloakUser.id};

	const user = interaction.options.getUser("user");
	if (user) {
		const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName);
		if (!keycloakId) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))
				]
			});
			return null;
		}
		askedPlayer = {keycloakId};
	}
	const rank = interaction.options.get("rank");
	if (rank) {
		askedPlayer = {rank: <number>rank.value};
	}

	return makePacket(CommandMissionsPacketReq, {askedPlayer});
}

/*
 * Handle the response of the server to the missions command
 * This is triggered when the player has not been found
 */
export async function handleCommandMissionPlayerNotFoundPacket(packet: CommandMissionPlayerNotFoundPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	await interaction?.reply({
		embeds: [
			new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))
		]
	});
}

/*
 * Handle the response of the server to the missions command
 * This is triggered when the player has been found
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
		pseudo: discordUser.username
	}), discordUser);

	const campaignMission = packet.missions.find(mission => mission.missionType === MissionType.CAMPAIGN);
	const campaignMissionDescription = `${i18n.t("commands:missions.subcategories.campaign", {
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

	const dailyMission = packet.missions.find(mission => mission.missionType === MissionType.DAILY)!;

	const dailyMissionDescription = `${i18n.t("commands:missions.subcategories.daily", {
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

	const sideMissions = packet.missions.filter(mission => mission.missionType === MissionType.NORMAL);
	const sideMissionsList: string = sideMissions.length > 0
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
		});
	const sideMissionsDescription = `${i18n.t("commands:missions.subcategories.sideMissions", {
		lng: interaction.userLanguage,
		current: sideMissions.length,
		max: packet.maxSideMissionSlots
	})}
${sideMissionsList}`;

	missionCommandEmbed.setDescription([campaignMissionDescription, dailyMissionDescription, sideMissionsDescription].join("\n"));
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
	requirements: {
		disallowEffects: [Effect.NOT_STARTED, Effect.DEAD]
	},
	mainGuildCommand: false
};