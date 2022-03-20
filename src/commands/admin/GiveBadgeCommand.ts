import {Entities} from "../../core/models/Entity";
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
	entity.Player.addBadge(interaction.options.getString("badge"));
	await entity.Player.save();

	return await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(gbModule.get("giveSuccess"), interaction.user)
			.setDescription(gbModule.format("descGive", {
				badge: interaction.options.getString("badge"),
				player: interaction.options.getUser("user")
			}))]
	});
}

function getAllBadgesForOptions(): [string, string][] {
	const tabBadges: [string, string][] = [];
	for (const badge of Constants.BADGES.LIST) {
		tabBadges.push([badge, badge]);
	}
	return tabBadges;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("givebadge")
		.setDescription("Give a badge to a given user (badge manager only)")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to give a baadge")
			.setRequired(true))
		.addStringOption(option => option.setName("badge")
			.setDescription("The badge to give")
			.setRequired(true)
			.addChoices(getAllBadgesForOptions())) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.BADGE_MANAGER
	},
	mainGuildCommand: true,
	slashCommandPermissions: null
};