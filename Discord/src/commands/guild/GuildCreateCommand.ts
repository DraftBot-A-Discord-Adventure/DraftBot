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
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {
	CommandGuildCreatePacketReq,
	CommandGuildCreatePacketRes, CommandGuildCreateRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
import {printTimeBeforeDate} from "../../../../Lib/src/utils/TimeUtils";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ReactionCollectorPetFreeData} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetFree";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {PetUtils} from "../../utils/PetUtils";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {
	CommandPetFreeAcceptPacketRes,
	CommandPetFreeRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {ReactionCollectorGuildCreateData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildCreate";

/**
 * Create a new guild
 */
async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandGuildCreatePacketReq | null> {
	const guildNameOption = interaction.options.get("guildName");
	const askedGuildName = guildNameOption ? <string>guildNameOption.value : "";
	return makePacket(CommandGuildCreatePacketReq, {keycloakId: user.id, askedGuildName});
}

export async function handleCommandGuildCreatePacketRes(packet: CommandGuildCreatePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (interaction) {
		if (!packet.foundGuild) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:alreadyInAGuild", {lng: interaction.userLanguage})
					)
				]
			});
			return;
		}
		if (!packet.guildNameIsAvailable) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:guildAlreadyExist", {lng: interaction.userLanguage})
					)
				]
			});
			return;
		}
		if (!packet.guildNameIsAcceptable) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:guildNameNotValid", {
							lng: interaction.userLanguage,
							min: GuildConstants.GUILD_NAME_LENGTH_RANGE.MIN,
							max: GuildConstants.GUILD_NAME_LENGTH_RANGE.MAX
						})
					)
				]
			});
			return;
		}
	}
}


export async function createGuildCreateCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildCreateData;

	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildCreate.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:guildCreate.confirmDesc", {
				lng: interaction.userLanguage,
				pet: PetUtils.petToShortString(interaction.userLanguage, data.petNickname, data.petId, data.petSex)
			})
		);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function handleCommandGuildCreateRefusePacketRes(packet: CommandGuildCreateRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:petFree.canceledTitle", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:petFree.canceledDesc", {lng: originalInteraction.userLanguage})
					)
					.setErrorColor()
			]
		});
	}
}

export async function handleCommandGuildCreateAcceptPacketRes(packet: CommandPetFreeAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:petFree.title", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:petFree.acceptedDesc", {
							lng: originalInteraction.userLanguage,
							pet: PetUtils.petToShortString(originalInteraction.userLanguage, packet.petNickname, packet.petId, packet.petSex)
						})
					)
			]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildCreate")
		.addStringOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildCreate", "guildName", option)
				.setRequired(true)) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [Effect.NOT_STARTED]
	},
	mainGuildCommand: false
};