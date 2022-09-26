import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Displays the several rarities that an item can get in the game
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
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

const currentCommandFrenchTranslations = Translations.getModule("commands.rarity", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.rarity", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};