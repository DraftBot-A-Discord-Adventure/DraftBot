import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandPetFreePacketReq, CommandPetFreePacketRes} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {PetData, PetUtils} from "../../utils/PetUtils";

/**
 * Destroy a pet forever... RIP
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandPetFreePacketReq | null> {

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

	return makePacket(CommandPetFreePacketReq, {askedPlayer});
}


export async function handleCommandPetPacketRes(packet: CommandPetFreePacketRes, context: PacketContext): Promise<void> {
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

		const petData: PetData = packet.data!;

		const PetCommandEmbed = new DraftBotEmbed()
			.formatAuthor(
				i18n.t("commands:pet.embedTitle", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}),
				interaction.user
			)
			.setDescription(
				PetUtils.petToString(interaction.userLanguage, petData)
			);

		await interaction.reply({
			embeds: [PetCommandEmbed],
			fetchReply: true
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("petFree"),
	getPacket,
	requirements: {
		allowEffects: [Effect.NO_EFFECT]
	},
	mainGuildCommand: false
};