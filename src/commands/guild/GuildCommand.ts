import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities, Entity} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import Player, {Players} from "../../core/models/Player";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction, TextChannel, User} from "discord.js";
import {Translations} from "../../core/Translations";
import {Data} from "../../core/Data";

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean, interaction?: CommandInteraction): Promise<void>;

declare function progressBar(value: number, maxValue: number): string;

/**
 * Allow to display the info of a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guildModule = Translations.getModule("commands.guild", language);

	let guild;
	if (interaction.options.getString("guild_s_name")) {
		try {
			guild = await Guilds.getByName(interaction.options.getString("guild_s_name"));
		}
		catch (error) {
			guild = null;
		}
	}
	else {
		// search for a user's guild
		let entityToAnalyse = await Entities.getByOptions(interaction);
		if (entityToAnalyse === null) {
			entityToAnalyse = entity;
		}
		try {
			guild = await Guilds.getById(entityToAnalyse.Player.guildId);
		}
		catch (error) {
			guild = null;
		}
	}

	const embed = new DraftBotEmbed();

	if (guild === null) {
		return sendErrorMessage(
			interaction.user,
			<TextChannel>interaction.channel,
			language,
			guildModule.get("noGuildException"),
			false,
			interaction
		);
	}
	const members = await Entities.getByGuild(guild.id);

	const chief = await Player.findOne({where: {id: guild.chiefId}});

	let membersInfos = "";

	for (const member of members) {
		// if member is the owner of guild
		if (member.Player.id === guild.chiefId) {
			membersInfos += guildModule.format("chiefinfos",
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: await Players.getRankById(member.Player.id),
					score: member.Player.score
				}
			);
		}
		else if (member.Player.id === guild.elderId) {
			membersInfos += guildModule.format(
				"elderinfos",
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: await Players.getRankById(member.Player.id),
					score: member.Player.score
				}
			);
		}
		else {
			membersInfos += guildModule.format(
				"memberinfos",
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: await Players.getRankById(member.Player.id),
					score: member.Player.score
				}
			);
		}
	}

	embed.setThumbnail(Data.getModule("commands.guild").getString("icon"));

	embed.setTitle(
		guildModule.format("title", {
			guildName: guild.name,
			pseudo: await chief.getPseudo(language)
		})
	);

	if (guild.guildDescription) {
		embed.setDescription(
			guildModule.format(
				"description",
				{
					description: guild.guildDescription
				}
			)
		);
	}
	embed.addField(
		guildModule.format("members", {
			memberCount: members.length,
			maxGuildMembers: Constants.GUILD.MAX_GUILD_MEMBER
		}),
		membersInfos
	);
	if (!guild.isAtMaxLevel()) {
		embed.addField(
			guildModule.format(
				"experience",
				{
					xp: guild.experience,
					xpToLevelUp: guild.getExperienceNeededToLevelUp(),
					level: guild.level
				}
			),
			progressBar(guild.experience, guild.getExperienceNeededToLevelUp())
		);
	}
	else {
		embed.addField(
			guildModule.get("lvlMax"),
			progressBar(1, 1)
		);
	}
	await interaction.reply({embeds: [embed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guild")
		.setDescription("Displays the guild through a player or through its name")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the guild")
			.setRequired(false)
		)
		.addStringOption(option => option.setName("guild_s_name")
			.setDescription("The name of the guild to display")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the guild")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
