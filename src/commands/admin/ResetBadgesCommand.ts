import {Entities} from "../../core/database/game/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow the bot owner or a badge manager to remove all badges from somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const playerToReset = interaction.options.getUser("user");
	const [entity] = await Entities.getOrRegister(playerToReset.id);

	entity.Player.badges = null;
	await entity.Player.save();

	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(Translations.getModule("commands.resetBadge", language).get("resetSuccess"), interaction.user)
			.setDescription(
				Translations.getModule("commands.resetBadge", language)
					.format("descReset",
						{player: playerToReset}))]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.resetBadge", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.resetBadge", Constants.LANGUAGE.ENGLISH);
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
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BADGE_MANAGER
	},
	mainGuildCommand: true
};