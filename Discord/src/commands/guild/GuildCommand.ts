import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandGuildPacketReq, CommandGuildPacketRes} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import {SlashCommandBuilder} from "@discordjs/builders";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ColorResolvable, EmbedField, Message, MessageReaction} from "discord.js";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ColorConstants} from "../../../../Lib/src/constants/ColorConstants";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";

/**
 * Display all the information about a guild
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandGuildPacketReq | null> {

	const guildNameOption = interaction.options.get("guildName");
	const askedGuildName = guildNameOption ? <string>guildNameOption.value : undefined;


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

	return makePacket(CommandGuildPacketReq, {askedPlayer, askedGuildName});
}

export async function handleCommandGuildPacketRes(packet: CommandGuildPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundGuild) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:guildDoesntExist", {lng: interaction.userLanguage})
					)
				]
			});
			return;
		}

		const keycloakUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.askedPlayerKeycloakId!))!;

		const guildCommandEmbed = new DraftBotEmbed()
			.setThumbnail(GuildConstants.ICON);

		if (packet.data!.level >= GuildConstants.GOLDEN_GUILD_LEVEL) {
			guildCommandEmbed.setColor(ColorConstants.GOLD);
		}

		guildCommandEmbed.setTitle(i18n.t("commands:guild.embedTitle", {
			lng: interaction.userLanguage,
			guildName: packet.data?.name,
			level: packet.data?.level
		}));

		if (packet.data!.description) {
			guildCommandEmbed.setDescription(
				i18n.t("commands:guild.description", {
					lng: interaction.userLanguage,
					description: packet.data?.description
				})
			);
		}

		let membersInfos = "";
		for (const member of packet.data!.members) {
			membersInfos += i18n.t("commands:guild.memberInfos", {
				lng: interaction.userLanguage,
				icon:
				isChief: member.id === packet.data!.chiefId,
				isElder: member.id === packet.data!.elderId,
				pseudo: (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, member.keycloakId))?.attributes.gameUsername,
				ranking: member.rank,
				score: member.score,
				isOnPveIsland: member.islandStatus.isOnPveIsland,
				isOnBoat: member.islandStatus.isOnBoat,
				isPveIslandAlly: member.islandStatus.isPveIslandAlly,
				isInactive: member.islandStatus.isInactive,
				isNotBotJoinable: member.islandStatus.cannotBeJoinedOnBoat
			});
		}

		guildCommandEmbed.addFields({
			name: guildModule.format("members", {
				memberCount: members.length,
				maxGuildMembers: GuildConstants.MAX_GUILD_MEMBERS
			}),
			value: membersInfos
		});


		const reply = await interaction.reply({
			embeds: [
				new DraftBotEmbed()
					.setColor(<ColorResolvable>packet.data!.color)
					.setTitle(i18n.t("commands:profile.title", {
						lng: interaction.userLanguage,
						effect: titleEffect,
						pseudo: keycloakUser.attributes.gameUsername,
						level: packet.data?.level
					}))
					.addFields(generateFields(packet, interaction.userLanguage))
			],
			fetchReply: true
		}) as Message;
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guild")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("guild", "user", option)
				.setRequired(false))
		.addStringOption(option =>
			SlashCommandBuilderGenerator.generateOption("guild", "guildName", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("guild", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};