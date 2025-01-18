import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorGuildElderData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildElder";
import {
	CommandGuildElderAcceptPacketRes,
	CommandGuildElderPacketReq,
	CommandGuildElderRefusePacketRes, CommandGuildElderSameGuildPacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildElderPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {PacketUtils} from "../../utils/PacketUtils";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Create a collector to confirm the promotion
 * @param packet
 * @param context
 */
export async function createGuildElderCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildElderData;
	const elderPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.promotedKeycloakId))!;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElder.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:guildElder.confirmDesc", {
				lng: interaction.userLanguage,
				elderPseudo: elderPlayer.attributes.gameUsername,
				guildName: data.guildName
			})
		);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

/**
 * Handle the response of the server after a guild elder,
 * this packet is only sent if the promotion is refused
 * @param packet
 * @param context
 */
export async function handleCommandGuildElderRefusePacketRes(packet: CommandGuildElderRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const promotedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.promotedKeycloakId))!;
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElder.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:guildElder.canceledDesc", {
						lng: originalInteraction.userLanguage,
						elderPseudo: promotedPlayer.attributes.gameUsername
					})
				)
				.setErrorColor()
		]
	});
}
export async function handleCommandGuildElderNotSameGuildPacketRes(packet: CommandGuildElderSameGuildPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("error:titleDidntWork", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:guildElder.notSameGuild", {
						lng: originalInteraction.userLanguage
					})
				)
				.setErrorColor()
		]
	});
}


/**
 * Handle the response of the server after a guild elder,
 * this packet is only sent if the promotion is accepted
 * @param packet
 * @param context
 */
export async function handleCommandGuildElderAcceptPacketRes(packet: CommandGuildElderAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const promotedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.promotedKeycloakId!))!;
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElder.successElderAddTitle", {
					lng: originalInteraction.userLanguage,
					elderPseudo: promotedPlayer.attributes.gameUsername,
					guildName: packet.guildName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:guildElder.acceptedDesc", {lng: originalInteraction.userLanguage})
					)
			]
		});
	}
}

/**
 * Promote a player from a guild
 */
async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandGuildElderPacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!askedPlayer || !askedPlayer.keycloakId) {
		return null;
	}
	return makePacket(CommandGuildElderPacketReq, {askedPlayerKeycloakId: askedPlayer.keycloakId});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildElder")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildElder", "user", option)
				.setRequired(true)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};