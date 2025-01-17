import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {PacketUtils} from "../../utils/PacketUtils";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandGuildLeavePacketReq} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
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
	const keyDesc = data.guildIsDestroyed ? data.newChiefKeycloakId !== null ? "confirmChiefDescWithElder" : "confirmChiefDesc" : "confirmDesc";
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

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandGuildLeavePacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!askedPlayer || !askedPlayer.keycloakId) {
		return null;
	}
	return makePacket(CommandGuildLeavePacketReq, {askedPlayerKeycloakId: askedPlayer.keycloakId});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildLeave"),
	getPacket,
	mainGuildCommand: false
};