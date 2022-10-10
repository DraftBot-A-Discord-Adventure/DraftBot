import {DraftBotInventoryEmbedBuilder} from "../../core/messages/DraftBotInventoryEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";

/**
 * Shows the inventory of the given player (default player is the one who entered the command)
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	let askedPlayer = await Players.getByOptions(interaction);
	if (!askedPlayer) {
		askedPlayer = player;
	}

	await (await new DraftBotInventoryEmbedBuilder(interaction.user, language, askedPlayer)
		.build())
		.reply(interaction);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.inventory", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.inventory", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
