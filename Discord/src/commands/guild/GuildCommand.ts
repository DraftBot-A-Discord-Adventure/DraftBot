import { ICommand } from "../ICommand";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandGuildPacketReq, CommandGuildPacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import { GuildMember } from "../../../../Lib/src/types/GuildMember";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotErrorEmbed } from "../../messages/DraftBotErrorEmbed";
import { GuildConstants } from "../../../../Lib/src/constants/GuildConstants";
import { ColorConstants } from "../../../../Lib/src/constants/ColorConstants";
import { KeycloakUser } from "../../../../Lib/src/keycloak/KeycloakUser";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { progressBar } from "../../../../Lib/src/utils/StringUtils";
import { PacketUtils } from "../../utils/PacketUtils";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";

/**
 * Display all the information about a guild
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandGuildPacketReq | null> {
	const guildNameOption = interaction.options.get("guild");
	const askedGuildName = guildNameOption ? <string>guildNameOption.value : undefined;

	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, keycloakUser);
	if (!askedPlayer) {
		return null;
	}

	return makePacket(CommandGuildPacketReq, {
		askedPlayer, askedGuildName
	});
}

/**
 * Get the icon depending on what type of member the player is (chief, elder, member)
 * @param member
 * @param packet
 */
function getMemberTypeIcon(member: GuildMember, packet: CommandGuildPacketRes): string {
	return member.id === packet.data!.chiefId
		? DraftBotIcons.guild.chief
		: member.id === packet.data!.elderId
			? DraftBotIcons.guild.elder
			: DraftBotIcons.guild.member;
}

/**
 * Return the icons corresponding to the island status of the member
 * @param member
 * @param interaction
 */
function getIslandStatusIcon(member: GuildMember, interaction: DraftbotInteraction): string {
	return member.islandStatus.isOnPveIsland || member.islandStatus.isOnBoat || member.islandStatus.isPveIslandAlly || member.islandStatus.cannotBeJoinedOnBoat
		? i18n.t("commands:guild.separator", { lng: interaction.userLanguage })
		+ (member.islandStatus.isOnPveIsland
			? DraftBotIcons.guild.isOnPveIsland
			: "")
		+ (member.islandStatus.isOnBoat
			? DraftBotIcons.guild.isOnBoat
			: "")
		+ (member.islandStatus.isPveIslandAlly
			? DraftBotIcons.guild.countAsAnAlly
			: "")
		+ (member.islandStatus.cannotBeJoinedOnBoat
			? DraftBotIcons.guild.cannotBeJoinedOnBoat
			: "")
		: "";
}

export async function handleCommandGuildPacketRes(packet: CommandGuildPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return;
	}
	const lng = interaction.userLanguage;

	if (!packet.foundGuild) {
		await interaction.reply({
			embeds: [
				new DraftBotErrorEmbed(
					interaction.user,
					interaction,
					i18n.t("error:guildDoesntExist", { lng })
				)
			]
		});
		return;
	}
	let membersInfos = "";
	for (const member of packet.data!.members) {
		membersInfos += i18n.t("commands:guild.memberInfos", {
			lng,
			icon: getMemberTypeIcon(member, packet),
			pseudo: (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, member.keycloakId))?.attributes.gameUsername,
			ranking: member.rank,
			score: member.score,
			islandStatusIcon: getIslandStatusIcon(member, interaction)
		});
	}
	const guildCommandEmbed = new DraftBotEmbed()
		.setThumbnail(GuildConstants.ICON)
		.setTitle(i18n.t("commands:guild.embedTitle", {
			lng,
			guildName: packet.data?.name,
			level: packet.data?.level
		}))
		.addFields({
			name: i18n.t("commands:guild.members", {
				lng,
				memberCount: packet.data!.members.length,
				maxGuildMembers: GuildConstants.MAX_GUILD_MEMBERS
			}),
			value: membersInfos
		});
	if (packet.data!.level >= GuildConstants.GOLDEN_GUILD_LEVEL) {
		guildCommandEmbed.setColor(ColorConstants.GOLD);
	}
	if (packet.data!.description) {
		guildCommandEmbed.setDescription(
			i18n.t("commands:guild.description", {
				lng,
				description: packet.data?.description
			})
		);
	}
	const pveIslandInfo = packet.data!.members.some(
		member => member.keycloakId === context.keycloakId
	)
		? i18n.t("commands:guild.islandInfo", {
			lng,
			membersOnPveIsland: packet.data!.members.filter(member => member.islandStatus.isPveIslandAlly).length
		})
		: "";
	const experienceInfo: string = packet.data!.isMaxLevel
		? i18n.t("commands:guild.xpMax", {
			lng
		})
		: i18n.t("commands:guild.xpNeeded", {
			lng,
			xp: packet.data!.experience.value,
			xpToLevelUp: packet.data!.experience.max
		});
	const rankingInfo = packet.data!.rank.rank > -1
		? i18n.t("commands:guild.ranking", {
			lng,
			rank: packet.data!.rank.rank,
			rankTotal: packet.data!.rank.numberOfGuilds
		})
		: i18n.t("commands:guild.notRanked", {
			lng
		});
	guildCommandEmbed.addFields({
		name: i18n.t("commands:guild.infoTitle", {
			lng,
			memberCount: packet.data!.members.length,
			maxGuildMembers: GuildConstants.MAX_GUILD_MEMBERS
		}),
		value: `${pveIslandInfo}${i18n.t("commands:guild.info", {
			lng,
			experience: experienceInfo,
			guildPoints: packet.data!.rank.score,
			ranking: rankingInfo,
			interpolation: {
				escapeValue: false
			}
		})}\n${packet.data!.isMaxLevel ? progressBar(1, 1) : progressBar(packet.data!.experience.value, packet.data!.experience.max)}`
	});
	await interaction.reply({
		embeds: [guildCommandEmbed],
		withResponse: true
	});
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
	mainGuildCommand: false
};
