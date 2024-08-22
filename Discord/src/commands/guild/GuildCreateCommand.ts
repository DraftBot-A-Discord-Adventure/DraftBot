import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {
	CommandGuildCreateAcceptPacketRes,
	CommandGuildCreatePacketReq,
	CommandGuildCreatePacketRes,
	CommandGuildCreateRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorGuildCreateData} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildCreate";
import {GuildCreateConstants} from "../../../../Lib/src/constants/GuildCreateConstants";

/**
 * Create a new guild
 */
function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): CommandGuildCreatePacketReq {
	const askedGuildName = <string>interaction.options.get("name", true).value;
	return makePacket(CommandGuildCreatePacketReq, {keycloakId: user.id, askedGuildName});
}

async function replyErrorEmbed(context: PacketContext, errorKey: string, formatParams: Record<string, unknown> = {}): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	formatParams.lng = interaction?.userLanguage;
	const params = {
		embeds: [
			new DraftBotErrorEmbed(
				interaction!.user,
				interaction!,
				i18n.t(errorKey, formatParams)
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


export async function handleCommandGuildCreatePacketRes(packet: CommandGuildCreatePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (interaction) {
		if (packet.playerMoney < GuildCreateConstants.PRICE) {
			await replyErrorEmbed(context, "error:notEnoughMoney", {
				money: GuildCreateConstants.PRICE - packet.playerMoney
			});
			return;
		}
		if (packet.foundGuild) {
			await replyErrorEmbed(context, "error:alreadyInAGuild");
			return;
		}
		if (!packet.guildNameIsAvailable) {
			await replyErrorEmbed(context, "error:guildAlreadyExist");
			return;
		}
		if (!packet.guildNameIsAcceptable) {
			await replyErrorEmbed(context, "error:guildNameNotValid", {
				min: GuildConstants.GUILD_NAME_LENGTH_RANGE.MIN,
				max: GuildConstants.GUILD_NAME_LENGTH_RANGE.MAX
			});
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
				guildName: data.guildName,
				price: GuildCreateConstants.PRICE
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
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildCreate.canceledTitle", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:guildCreate.canceledDesc", {lng: originalInteraction.userLanguage})
					)
					.setErrorColor()
			]
		});
	}
}

export async function handleCommandGuildCreateAcceptPacketRes(packet: CommandGuildCreateAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildCreate.title", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:guildCreate.acceptedDesc", {
							lng: originalInteraction.userLanguage,
							guildName: packet.guildName
						})
					)
					.setFooter({
						text:
							i18n.t("commands:guildCreate.acceptedFooter", {lng: originalInteraction.userLanguage})
					})
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
		requiredLevel: GuildConstants.REQUIRED_LEVEL,
		disallowEffects: [Effect.NOT_STARTED, Effect.DEAD]
	},
	mainGuildCommand: false
};