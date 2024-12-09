import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DiscordCache} from "../../bot/DiscordCache";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {CommandUnlockAcceptPacketRes, CommandUnlockPacketReq, CommandUnlockPacketRes, CommandUnlockRefusePacketRes} from "../../../../Lib/src/packets/commands/CommandUnlockPacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorUnlockData} from "../../../../Lib/src/packets/interaction/ReactionCollectorUnlock";
import {PacketUtils} from "../../utils/PacketUtils";
import {CommandProfilePacketReq} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
import {sendErrorMessage, SendManner} from "../../utils/ErrorUtils";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {UnlockConstants} from "../../../../Lib/src/constants/UnlockConstants";

/**
 * Free a player from the prison
 */
async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandProfilePacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!askedPlayer) {
		return null;
	}
	return makePacket(CommandUnlockPacketReq, {askedPlayer});
}

/**
 * Handle the answer from the server after an unlock command request
 * This packet is only sent if the unlocking cannot be done for some reason
 * @param packet
 * @param context
 */
export async function handleCommandUnlockPacketRes(packet: CommandUnlockPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (!interaction) {
		return;
	}
	if (!packet.foundPlayer) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}),
			{sendManner: SendManner.REPLY}
		);
		return;
	}
	if (packet.notInJail) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("commands:unlock.notInJail", {lng: interaction.userLanguage}),
			{sendManner: SendManner.REPLY}
		);
		return;
	}
	if (packet.money < UnlockConstants.PRICE_FOR_UNLOCK) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("error:notEnoughMoney", {
				lng: interaction.userLanguage,
				money: UnlockConstants.PRICE_FOR_UNLOCK - packet.money
			}),
			{sendManner: SendManner.REPLY}
		);
		return;
	}
	if (packet.himself) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("commands:unlock.himself", {lng: interaction.userLanguage}),
			{sendManner: SendManner.REPLY}
		);
	}
}

/**
 * Create a collector to confirm the unlocking
 * @param packet
 * @param context
 */
export async function createUnlockCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorUnlockData;
	const unlockedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.unlockedKeycloakId))!;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:unlock.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:unlock.confirmDesc", {
				lng: interaction.userLanguage,
				kickedPseudo: unlockedPlayer.attributes.gameUsername
			})
		);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

/**
 * Handle the server response after an unlock command has been canceled
 * @param packet
 * @param context
 */
export async function handleCommandUnlockRefusePacketRes(packet: CommandUnlockRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:unlock.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:unlock.canceledDesc", {
						lng: originalInteraction.userLanguage
					})
				)
				.setErrorColor()
		]
	});
}

/**
 * Handle the response of the server after a guild kick,
 * this packet is only sent if the kick is accepted
 * @param packet
 * @param context
 */
export async function handleCommandUnlockAcceptPacketRes(packet: CommandUnlockAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const unlockedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.unlockedKeycloakId!))!;
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:unlock.title", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:unlock.acceptedDesc", {
						lng: originalInteraction.userLanguage,
						kickedPseudo: unlockedPlayer.attributes.gameUsername
					})
				)
		]
	});

}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("unlock")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("unlock", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("unlock", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};