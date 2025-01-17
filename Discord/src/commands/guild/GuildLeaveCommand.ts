import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {PacketUtils} from "../../utils/PacketUtils";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	CommandGuildLeaveAcceptPacketRes,
	CommandGuildLeavePacketReq
} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorGuildLeaveData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildLeave";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";


export async function createGuildLeaveCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildLeaveData;
	const elderPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.newChiefKeycloakId))!;
	const keyDesc = data.guildIsDestroyed ? "confirmChiefDesc" : data.newChiefKeycloakId !== null ? "confirmChiefDescWithElder" : "confirmDesc";
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildLeave.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t(`commands:guildLeave.${keyDesc}`, {
				lng: interaction.userLanguage,
				elderPseudo: elderPlayer.attributes.gameUsername,
				guildName: data.guildName
			})
		);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function handleCommandGuildLeaveAcceptPacketRes(packet: CommandGuildLeaveAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const keyTitle = packet.newChiefKeycloakId ? "newChiefTitle" : "successTitle";
	const keyDesc = packet.isGuildDestroyed ? "destroySuccess" : "leavingSuccess";
	const elder = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.newChiefKeycloakId!))!;
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t(`commands:guildLeave.${keyTitle}`, {
					lng: originalInteraction.userLanguage,
					elderPseudo: elder.attributes.gameUsername,
					guildName: packet.guildName
				}), originalInteraction.user)
					.setDescription(
						i18n.t(`commands:guildLeave.${keyDesc}`, {lng: originalInteraction.userLanguage, guildName: packet.guildName})
					)
			]
		});
	}
}

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandGuildLeavePacketReq | null> {
	const player = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!player || !player.keycloakId) {
		return null;
	}
	return makePacket(CommandGuildLeavePacketReq, {playerKeycloakId: player.keycloakId});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildLeave"),
	getPacket,
	mainGuildCommand: false
};