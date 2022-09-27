import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import {Guilds} from "../../core/database/game/models/Guild";
import {Players} from "../../core/database/game/models/Player";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {progressBar} from "../../core/utils/StringUtils";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {GuildConstants} from "../../core/constants/GuildConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow to display the info of a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guildModule = Translations.getModule("commands.guild", language);

	let guild;
	if (interaction.options.get("name")) {
		try {
			guild = await Guilds.getByName(interaction.options.get("name").value as string);
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
		await replyErrorMessage(
			interaction,
			language,
			guildModule.get("noGuildException")
		);
		return;
	}
	const members = await Entities.getByGuild(guild.id);

	const chief = (await Entities.getById(guild.chiefId)).Player;

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

	embed.setThumbnail(GuildConstants.ICON);

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
	embed.addFields({
		name: guildModule.format("members", {
			memberCount: members.length,
			maxGuildMembers: Constants.GUILD.MAX_GUILD_MEMBER
		}),
		value: membersInfos
	});
	if (!guild.isAtMaxLevel()) {
		embed.addFields({
			name: guildModule.format(
				"experience",
				{
					xp: guild.experience,
					xpToLevelUp: guild.getExperienceNeededToLevelUp(),
					level: guild.level
				}
			),
			value: progressBar(guild.experience, guild.getExperienceNeededToLevelUp())
		});
	}
	else {
		embed.addFields({
			name: guildModule.get("lvlMax"),
			value: progressBar(1, 1)
		});
	}
	await interaction.reply({embeds: [embed]});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guild", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guild", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option => option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			})
			.setRequired(false)
		)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionGuildName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionGuildName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionGuildDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionGuildDescription")
			})
			.setRequired(false)
		)
		.addNumberOption(option => option.setName(currentCommandEnglishTranslations.get("optionRankName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionRankDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankDescription")
			})
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
