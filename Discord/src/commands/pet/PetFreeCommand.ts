import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	CommandPetFreePacketReq,
	CommandPetFreePacketRes
} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {millisecondsToMinutes} from "../../../../Lib/src/utils/TimeUtils";

/**
 * Destroy a pet forever... RIP
 */
function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): CommandPetFreePacketReq {
	return makePacket(CommandPetFreePacketReq, {keycloakId: keycloakUser.id});
}


export async function handleCommandPetFreePacketRes(packet: CommandPetFreePacketRes, context: PacketContext): Promise<void> {
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
		if (!packet.petCanBeFreed) {
			if (packet.missingMoney! > 0) {
				await interaction.reply({
					embeds: [
						new DraftBotErrorEmbed(
							interaction.user,
							interaction,
							i18n.t("error:notEnoughMoney", {lng: interaction.userLanguage, money: packet.missingMoney})
						)
					]
				});
			}
			else {
				await interaction.reply({
					embeds: [
						new DraftBotErrorEmbed(
							interaction.user,
							interaction,
							i18n.t("error:cooldownPetFree", {
								lng: interaction.userLanguage,
								remainingTime: millisecondsToMinutes(packet.cooldownRemainingTimeMs!)
							})
						)
					]
				});
			}
		}
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