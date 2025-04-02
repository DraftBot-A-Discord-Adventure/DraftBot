import { DraftbotInteraction } from "../../messages/DraftbotInteraction.js";
import {
	CommandGuildInviteAcceptPacketRes,
	CommandGuildInviteErrorPacket,
	CommandGuildInvitePacketReq,
	CommandGuildInviteRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildInvitePacket.js";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils.js";
import {
	draftBotClient, keycloakConfig
} from "../../bot/DraftBotShard.js";
import { DraftBotErrorEmbed } from "../../messages/DraftBotErrorEmbed.js";
import i18n from "../../translations/i18n.js";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket.js";
import { DiscordCache } from "../../bot/DiscordCache.js";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket.js";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed.js";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils.js";
import { ReactionCollectorGuildInviteData } from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildInvite.js";
import { ICommand } from "../ICommand.js";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildConstants } from "../../../../Lib/src/constants/GuildConstants.js";
import { ReactionCollectorReturnType } from "../../packetHandlers/handlers/ReactionCollectorHandlers";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandGuildInvitePacketReq | null> {
	const invitedUser = interaction.options.getUser("user")!;
	const invitedPlayerRawKeycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, invitedUser.id, invitedUser.displayName);
	if (!invitedPlayerRawKeycloakId) {
		await interaction.reply({ embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", { lng: interaction.userLanguage }))] });
		return null;
	}
	return makePacket(CommandGuildInvitePacketReq, { invitedPlayerkeycloakId: invitedPlayerRawKeycloakId });
}

export async function handleCommandGuildInviteError(packet: CommandGuildInviteErrorPacket, context: PacketContext, errorKey: string): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (!interaction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const params = {
		embeds: [
			new DraftBotErrorEmbed(
				interaction.user,
				interaction,
				i18n.t(errorKey, {
					level: GuildConstants.REQUIRED_LEVEL,
					guildName: packet.guildName,
					pseudo: (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.invitedPlayerKeycloakId))?.attributes.gameUsername![0],
					lng: interaction.userLanguage
				})
			)
		]
	};
	if (buttonInteraction) {
		await buttonInteraction.editReply(params);
		return;
	}
	await interaction.reply(params);
}

export async function createGuildInviteCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildInviteData;
	const invitedUser = interaction.options.getUser("user")!;
	const invitedKeycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, invitedUser.id, null);

	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildInvite.title", {
		lng: interaction.userLanguage,
		pseudo: invitedUser.displayName
	}), invitedUser)
		.setDescription(
			i18n.t("commands:guildInvite.confirmDesc", {
				lng: interaction.userLanguage,
				guildName: data.guildName
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, {
		acceptedUsersId: [invitedKeycloakId!],
		canInitiatorRefuse: true
	});
}

export async function handleCommandGuildInviteRefusePacketRes(packet: CommandGuildInviteRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const invitedPlayer = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.invitedPlayerKeycloakId);
	const invitedUser = await draftBotClient!.users.fetch(invitedPlayer!.attributes.discordId![0]);


	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildInvite.refusedTitle", {
					lng: originalInteraction.userLanguage,
					guildName: packet.guildName
				}), invitedUser)
					.setErrorColor()
			]
		});
	}
}

export async function handleCommandGuildInviteAcceptPacketRes(packet: CommandGuildInviteAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const invitedPlayer = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.invitedPlayerKeycloakId);
	const invitedUser = await draftBotClient!.users.fetch(invitedPlayer!.attributes.discordId![0]);

	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildInvite.successTitle", {
					lng: originalInteraction.userLanguage,
					pseudo: invitedUser.displayName,
					guildName: packet.guildName
				}), invitedUser)
					.setDescription(
						i18n.t("commands:guildInvite.successDesc", {
							lng: originalInteraction.userLanguage,
							guildName: packet.guildName
						})
					)
			]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildInvite")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildInvite", "user", option)
				.setRequired(true)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};
