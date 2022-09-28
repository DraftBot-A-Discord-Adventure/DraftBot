/**
 * Special class for generating SlashCommandBuilder
 */
import {TranslationModule} from "../core/Translations";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandUserOption} from "@discordjs/builders/dist/interactions/slashCommands/options/user";


export class SlashCommandBuilderGenerator {

	/**
	 * this is used to avoid having to write the same code for each command this method create a base command with a name and a description from the translation modules of the command
	 * @param currentCommandFrenchTranslations
	 * @param currentCommandEnglishTranslations
	 */
	static generateBaseCommand(currentCommandFrenchTranslations: TranslationModule, currentCommandEnglishTranslations: TranslationModule): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName(currentCommandEnglishTranslations.get("commandName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("commandName")
			})
			.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("commandDescription")
			});
	}

	static generateUserOption(currentCommandFrenchTranslations: TranslationModule, currentCommandEnglishTranslations: TranslationModule, option: SlashCommandUserOption): SlashCommandUserOption {
		return option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			});
	}

	static generateRankOption(currentCommandFrenchTranslations: TranslationModule, currentCommandEnglishTranslations: TranslationModule, option: SlashCommandUserOption): SlashCommandUserOption {
		return option.setName(currentCommandEnglishTranslations.get("optionRankName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionRankDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankDescription")
			});
	}
}