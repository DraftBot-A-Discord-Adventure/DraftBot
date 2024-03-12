import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandPetPacketReq, CommandPetPacketRes} from "../../../../Lib/src/packets/commands/CommandPetPacket";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Effect} from "../../../../Lib/src/enums/Effect";

/**
 * Display all the information about a Pet
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandPetPacketReq | null> {

	let askedPlayer: { keycloakId?: string, rank?: number } = {keycloakId: keycloakUser.id};
	const user = interaction.options.getUser("user");
	if (user) {
		const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName);
		if (!keycloakId) {
			await interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))]});
			return null;
		}
		askedPlayer = {keycloakId};
	}

	const rankOption = interaction.options.get("rank");
	if (rankOption) {
		askedPlayer = {rank: <number>rankOption.value};
	}

	return makePacket(CommandPetPacketReq, {askedPlayer});
}


export async function handleCommandPetPacketRes(packet: CommandPetPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPet) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:PetDoesntExist", {lng: interaction.userLanguage})
					)
				]
			});
			return;
		}

		const PetCommandEmbed = new DraftBotEmbed();

		await interaction.reply({
			embeds: [PetCommandEmbed],
			fetchReply: true
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("Pet")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("Pet", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("Pet", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [Effect.NOT_STARTED]
	},
	mainGuildCommand: false
};