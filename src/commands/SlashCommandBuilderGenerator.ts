/**
 * Special class for generating SlashCommandBuilder
 */
import {TranslationModule} from "../core/Translations";
import {SlashCommandBuilder} from "@discordjs/builders";


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
}