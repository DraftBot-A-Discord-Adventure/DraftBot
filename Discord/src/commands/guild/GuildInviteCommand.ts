import {DraftbotInteraction} from "../../messages/DraftbotInteraction.js";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser.js";
import {
	CommandGuildInviteAcceptPacketRes,
	CommandGuildInvitePacketReq, CommandGuildInvitePacketRes,
	CommandGuildInviteRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildInvitePacket.js";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils.js";
import {draftBotClient, keycloakConfig} from "../../bot/DraftBotShard.js";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed.js";
import i18n from "../../translations/i18n.js";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket.js";
import {DiscordCache} from "../../bot/DiscordCache.js";
import {LANGUAGE} from "../../../../Lib/src/Language.js";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket.js";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed.js";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils.js";
import {ReactionCollectorGuildInviteData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildInvite.js";
import {ICommand} from "../ICommand.js";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants.js";

async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandGuildInvitePacketReq | null> {

	const invitedUser = interaction.options.getUser("user")!;
	const invitedPlayerRawKeycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, invitedUser.id, invitedUser.displayName);
	if (!invitedPlayerRawKeycloakId) {
		await interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))]});
		return null;
	}
	const invitingPlayer: { keycloakId: string } = {keycloakId: keycloakUser.id};
	const invitedPlayer: { keycloakId: string } = {keycloakId: invitedPlayerRawKeycloakId};

	return makePacket(CommandGuildInvitePacketReq, {invitedPlayer, invitingPlayer});
}

async function replyErrorEmbed(context: PacketContext, errorKey: string, formatParams: Record<string, unknown> = {}): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const replacements = {
		lng: interaction?.userLanguage ?? LANGUAGE.ENGLISH,
		...formatParams
	};
	const params = {
		embeds: [
			new DraftBotErrorEmbed(
				interaction!.user,
				interaction!,
				i18n.t(errorKey, replacements)
			)
		]
	};
	if (interaction && buttonInteraction) {
		await buttonInteraction.editReply(params);
	}
	else if (interaction) {
		await interaction.reply(params);
	}
}


export async function handleCommandGuildInvitePacketRes(packet: CommandGuildInvitePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return;
	}

	if (packet.invitingPlayerNotInGuild) {
		await replyErrorEmbed(context, "error:notInAGuild");
		return;
	}

	if (packet.levelTooLow) {
		await replyErrorEmbed(context, "error:targetLevelTooLow", {level: GuildConstants.REQUIRED_LEVEL});
		return;
	}

	if (packet.guildIsFull) {
		await replyErrorEmbed(context, "error:guildIsFull");
		return;
	}

	if (packet.invitedPlayerIsDead) {
		await replyErrorEmbed(context, "error:anotherPlayerBlocked", {username: "error:blockedContext.dead"});
		return;
	}

	if (packet.invitedPlayerIsOnPveIsland) {
		await replyErrorEmbed(context, "error:titleBlocked", {pseudo: interaction.user.displayName});
		return;
	}

	if (packet.alreadyInAGuild) {
		await replyErrorEmbed(context, "error:playerIsAlreadyInAGuild", {guildName: packet.guildName});
	}
}


export async function createGuildInviteCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
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

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, { acceptedUsersId: [invitedKeycloakId!]});
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