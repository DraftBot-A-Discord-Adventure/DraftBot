import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {ChatInputCommandInteraction, CommandInteraction, SlashCommandSubcommandBuilder} from "discord.js";
import {TopConstants} from "../../core/constants/TopConstants";
import {TranslationModule, Translations} from "../../core/Translations";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {
	DraftBotTopPlayersMessage,
	TopDataType,
	TopScope,
	TopTiming
} from "../../core/messages/top/DraftBotTopPlayersMessage";
import {DraftBotTopGuildsMessage} from "../../core/messages/top/DraftBotTopGuildsMessage";

/**
 * Allow to display the rankings of the players
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	// Get page
	const pageOption = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionPageName"));
	const page = pageOption ? pageOption.value as number : 1;

	// Check if guilds top
	if (interaction.isChatInputCommand()) {
		const chatInput = interaction as ChatInputCommandInteraction;
		const typeUntested = chatInput.options.getSubcommand();
		if (typeUntested === Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("guildsTopCommandName")) {
			await new DraftBotTopGuildsMessage({
				interaction,
				language
			}, player, page).reply(interaction);
			return;
		}
	}

	// Check if the scope is global
	const scopeUntested = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionScopeName"));
	const serverScope = scopeUntested && scopeUntested.value as string === TopConstants.SERVER_SCOPE;

	// Check if week is asked
	const timingUntested = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionTimingName"));
	const isWeek = timingUntested && timingUntested.value as string === TopConstants.TIMING_WEEKLY;

	// Check if glory subcommand
	let isGlory = false;
	if (interaction.isChatInputCommand()) {
		const chatInput = interaction as ChatInputCommandInteraction;
		const typeUntested = chatInput.options.getSubcommand();
		if (typeUntested === Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("gloryTopCommandName")) {
			isGlory = true;
		}
	}

	// Send constructed embed
	await new DraftBotTopPlayersMessage({
		interaction,
		language
	}, {
		dataType: isGlory ? TopDataType.GLORY : TopDataType.SCORE,
		timing: isWeek ? TopTiming.WEEK : TopTiming.ALL_TIME,
		scope: serverScope ? TopScope.SERVER : TopScope.GLOBAL
	}, player, page).reply(interaction);
}

function getScoreSubCommand(
	frTr: TranslationModule,
	enTr: TranslationModule
): SlashCommandSubcommandBuilder {
	return new SlashCommandSubcommandBuilder()
		.setName(enTr.get("mainTopCommandName"))
		.setNameLocalizations({
			fr: frTr.get("mainTopCommandName")
		})
		.setDescription(enTr.get("mainTopCommandDescription"))
		.setDescriptionLocalizations({
			fr: frTr.get("optionScopeDescription")
		})
		.addStringOption(option =>
			SlashCommandBuilderGenerator.generateTopScopeOption(
				frTr, enTr, option
			).setRequired(false)
		)
		.addStringOption(option => option.setName(enTr.get("optionTimingName"))
			.setNameLocalizations({
				fr: frTr.get("optionTimingName")
			})
			.setDescription(enTr.get("optionTimingDescription"))
			.setDescriptionLocalizations({
				fr: frTr.get("optionTimingDescription")
			})
			.addChoices(
				{
					name: enTr.get("timings.allTime"),
					"name_localizations": {
						fr: frTr.get("timings.allTime")
					}, value: TopConstants.TIMING_ALLTIME
				},
				{
					name: enTr.get("timings.weekly"),
					"name_localizations": {
						fr: frTr.get("timings.weekly")
					}, value: TopConstants.TIMING_WEEKLY
				}
			)
			.setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateTopPageOption(
				frTr, enTr, option
			)
				.setMinValue(1)
				.setRequired(false)
		);
}

function getGlorySubCommand(
	frTr: TranslationModule,
	enTr: TranslationModule
): SlashCommandSubcommandBuilder {
	return new SlashCommandSubcommandBuilder()
		.setName(enTr.get("gloryTopCommandName"))
		.setNameLocalizations({
			fr: frTr.get("gloryTopCommandName")
		})
		.setDescription(enTr.get("gloryTopCommandDescription"))
		.setDescriptionLocalizations({
			fr: frTr.get("gloryTopCommandDescription")
		})
		.addStringOption(option =>
			SlashCommandBuilderGenerator.generateTopScopeOption(
				frTr, enTr, option
			)
				.setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateTopPageOption(
				frTr, enTr, option
			)
				.setMinValue(1)
				.setRequired(false)
		);
}

function getGuildsSubCommand(
	frTr: TranslationModule,
	enTr: TranslationModule
): SlashCommandSubcommandBuilder {
	return new SlashCommandSubcommandBuilder()
		.setName(enTr.get("guildsTopCommandName"))
		.setNameLocalizations({
			fr: frTr.get("guildsTopCommandName")
		})
		.setDescription(enTr.get("guildsTopCommandDescription"))
		.setDescriptionLocalizations({
			fr: frTr.get("guildsTopCommandDescription")
		})
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateTopPageOption(
				frTr, enTr, option
			)
				.setMinValue(1)
				.setRequired(false)
		);
}

function getSlashCommandBuilder(): SlashCommandBuilder {
	const frTr = Translations.getModule("commands.top", Constants.LANGUAGE.FRENCH);
	const enTr = Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH);

	// Base command
	const command = SlashCommandBuilderGenerator.generateBaseCommand(frTr, enTr);

	// Add sub commands
	command
		.addSubcommand(getScoreSubCommand(frTr, enTr))
		.addSubcommand(getGlorySubCommand(frTr, enTr))
		.addSubcommand(getGuildsSubCommand(frTr, enTr));

	return command;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: getSlashCommandBuilder() as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};
