import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Guilds} from "../../core/database/game/models/Guild";
import {Player, Players} from "../../core/database/game/models/Player";
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
import {Maps} from "../../core/maps/Maps";
import {MapCache} from "../../core/maps/MapCache";

/**
 * Allow to display the info of a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const guildModule = Translations.getModule("commands.guild", language);

	let guild;
	const guildNameUntested = interaction.options.get(Translations.getModule("commands.guild", Constants.LANGUAGE.ENGLISH).get("optionGuildName"));
	if (guildNameUntested) {
		try {
			guild = await Guilds.getByName(guildNameUntested.value as string);
		}
		catch (error) {
			guild = null;
		}
	}
	else {
		// search for a user's guild
		let playerToAnalise = await Players.getByOptions(interaction);
		if (playerToAnalise === null) {
			playerToAnalise = player;
		}
		try {
			guild = await Guilds.getById(playerToAnalise.guildId);
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
	const members = await Players.getByGuild(guild.id);
	const membersPveAlliesIds = (await Maps.getGuildMembersOnPveIsland(player)).map((player) => player.discordUserId);

	let membersInfos = "";

	for (const member of members) {
		// if member is the owner of guild
		membersInfos += guildModule.format("memberinfos",
			{
				isChief: member.id === guild.chiefId,
				isElder: member.id === guild.elderId,
				pseudo: member.getPseudo(language),
				ranking: await Players.getRankById(member.id),
				score: member.score,
				isOnPveIsland: Maps.isOnPveIsland(member),
				isOnBoat: MapCache.boatEntryMapLinks.includes(member.mapLinkId),
				isPveIslandAlly: membersPveAlliesIds.includes(member.discordUserId)
			}
		);
	}

	embed.setThumbnail(GuildConstants.ICON);

	if (guild.level >= GuildConstants.GOLDEN_GUILD_LEVEL) {
		embed.setColor(Constants.COLOR.GOLD);
	}

	embed.setTitle(
		guildModule.format("title", {
			guildName: guild.name,
			level: guild.level
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
			maxGuildMembers: GuildConstants.MAX_GUILD_MEMBERS
		}),
		value: membersInfos
	});

	const ranking = await guild.getRanking();
	const pveIslandInfo = player.guildId === guild.id ? guildModule.format("islandInfo", {
		membersOnPveIsland: membersPveAlliesIds.length
	}) : "";
	embed.addFields({
		name: guildModule.get("infoTitle"),
		value: `${pveIslandInfo}${guildModule.format("info", {
			experience: guild.isAtMaxLevel() ? guildModule.get("xpMax") : guildModule.format(
				"xpNeeded",
				{
					xp: guild.experience,
					xpToLevelUp: guild.getExperienceNeededToLevelUp()
				}
			),
			guildPoints: guild.score,
			ranking: ranking > -1 ? guildModule.format("ranking", {
				rank: ranking,
				rankTotal: await Guilds.getTotalRanked()
			}) : guildModule.get("notRanked")
		})}\n${guild.isAtMaxLevel() ? progressBar(1, 1) : progressBar(guild.experience, guild.getExperienceNeededToLevelUp())}`
	});

	await interaction.reply({embeds: [embed]});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guild", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guild", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
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
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
