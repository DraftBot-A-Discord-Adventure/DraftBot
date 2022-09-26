import {Entities} from "../../core/database/game/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow the bot owner or a badge manager to give an item to somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const gbModule = Translations.getModule("commands.giveBadge", language);
	const playerId = interaction.options.getUser("user").id;
	const [entity] = await Entities.getOrRegister(playerId);
	entity.Player.addBadge(interaction.options.get("badge").value as string);
	await entity.Player.save();

	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(gbModule.get("giveSuccess"), interaction.user)
			.setDescription(gbModule.format("descGive", {
				badge: interaction.options.get("badge").value as string,
				player: interaction.options.getUser("user")
			}))]
	});
}

/**
 * Get all badge emote and descriptions
 */
function getAllBadgesForOptions(): { name: string, value: string }[] {
	const tabBadges: { name: string, value: string }[] = [];
	for (const badge of Constants.BADGES.LIST) {
		tabBadges.push({ name: badge, value: badge });
	}
	return tabBadges;
}

const currentCommandFrenchTranslations = Translations.getModule("commands.giveBadge", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.giveBadge", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations)
		.addUserOption(option => option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			})
			.setRequired(true))
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionBadgeName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionBadgeName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionBadgeDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionBadgeDescription")
			})
			.setRequired(true)
			.addChoices(...getAllBadgesForOptions())) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BADGE_MANAGER
	},
	mainGuildCommand: true
};