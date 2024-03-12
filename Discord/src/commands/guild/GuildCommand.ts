import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	CommandGuildPacketReq,
	CommandGuildPacketRes,
	GuildMemberPacket
} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ColorConstants} from "../../../../Lib/src/constants/ColorConstants";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Effect} from "../../../../Lib/src/enums/Effect";

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

/**
 * Get the icon depending on what type of member the player is (chief, elder, member)
 * @param member
 * @param packet
 */
function getMemberTypeIcon(member: GuildMemberPacket, packet: CommandGuildPacketRes): string {
	return member.id === packet.data!.chiefId ?
		i18n.t("commands:guild.emojis.chief") :
		member.id === packet.data!.elderId ?
			i18n.t("commands:guild.emojis.elder") :
			i18n.t("commands:guild.emojis.member");
}

/**
 * Return the icons corresponding to the island status of the member
 * @param member
 */
function getIslandStatusIcon(member: GuildMemberPacket): string {
	return member.islandStatus.isOnPveIsland || member.islandStatus.isOnBoat || member.islandStatus.isPveIslandAlly || member.islandStatus.cannotBeJoinedOnBoat ?
		i18n.t("commands:guild.separator")
		+ (member.islandStatus.isOnPveIsland ?
			i18n.t("commands:guild.emojis.pveIsland") :
			"")
		+ (member.islandStatus.isOnBoat ?
			i18n.t("commands:guild.emojis.boat") :
			"")
		+ (member.islandStatus.isPveIslandAlly ?
			i18n.t("commands:guild.emojis.pveIslandAlly") :
			"")
		+ (member.islandStatus.cannotBeJoinedOnBoat ?
			i18n.t("commands:guild.emojis.cannotBeJoinedOnBoat") :
			"") : "";
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
				icon: getMemberTypeIcon(member, packet),
				pseudo: (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, member.keycloakId))?.attributes.gameUsername,
				ranking: member.rank,
				score: member.score,
				islandStatusIcon: getIslandStatusIcon(member)
			});
		}

		guildCommandEmbed.addFields({
			name: i18n.t("commands:guild.members", {
				lng: interaction.userLanguage,
				memberCount: packet.data!.members.length,
				maxGuildMembers: GuildConstants.MAX_GUILD_MEMBERS
			}),
			value: membersInfos
		});


		await interaction.reply({
			embeds: [guildCommandEmbed],
			fetchReply: true
		});
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
		disallowEffects: [Effect.NOT_STARTED]
	},
	mainGuildCommand: false
};