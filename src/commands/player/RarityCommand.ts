import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

/**
 * Displays the link that allow to send the devs some suggestions
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string) {
	const tr = Translations.getModule("commands.rarity", language);
	const maxValue = Constants.RARITIES_GENERATOR.MAX_VALUE;
	const raritiesGenerator = Constants.RARITIES_GENERATOR.VALUES;
	const rarityEmbed = new DraftBotEmbed()
		.setDescription(tr.format("rarities",
			{
				pourcentageCommon: raritiesGenerator[0] * 100 / maxValue,
				pourcentageUncommon: (raritiesGenerator[1] - raritiesGenerator[0]) * 100 / maxValue,
				pourcentageExotic: (raritiesGenerator[2] - raritiesGenerator[1]) * 100 / maxValue,
				pourcentageRare: (raritiesGenerator[3] - raritiesGenerator[2]) * 100 / maxValue,
				pourcentageSpecial: (raritiesGenerator[4] - raritiesGenerator[3]) * 100 / maxValue,
				pourcentageEpic: (raritiesGenerator[5] - raritiesGenerator[4]) * 100 / maxValue,
				pourcentageLegendary: (raritiesGenerator[6] - raritiesGenerator[5]) * 100 / maxValue,
				pourcentageUnique: (maxValue - raritiesGenerator[6]) * 100 / maxValue
			}))
		.setTitle(tr.get("title"));
	await interaction.reply({
		embeds: [rarityEmbed]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("rarity")
		.setDescription("Get the probability to get an item according to its rarity"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOWEST
};