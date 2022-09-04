import {Entities} from "../../core/database/game/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";

/**
 * Allow the bot owner or a badgemanager to give an item to somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const gbModule = Translations.getModule("commands.giveBadgeCommand", language);
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("givebadge")
		.setDescription("Give a badge to a given user (badge manager only)")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to give a badge")
			.setRequired(true))
		.addStringOption(option => option.setName("badge")
			.setDescription("The badge to give")
			.setRequired(true)
			.addChoices(...getAllBadgesForOptions())) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BADGE_MANAGER
	},
	mainGuildCommand: true
};