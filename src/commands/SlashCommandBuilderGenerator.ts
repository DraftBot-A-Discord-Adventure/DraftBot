/**
 * Special class for generating SlashCommandBuilder
 */
import {TranslationModule} from "../core/Translations";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandUserOption} from "discord.js";
import {TopConstants} from "../core/constants/TopConstants";


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

	static generateRankOption(currentCommandFrenchTranslations: TranslationModule, currentCommandEnglishTranslations: TranslationModule, option: SlashCommandIntegerOption): SlashCommandIntegerOption {
		return option.setName(currentCommandEnglishTranslations.get("optionRankName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionRankDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankDescription")
			});
	}

	static generateTopScopeOption(
		currentCommandFrenchTranslations: TranslationModule,
		currentCommandEnglishTranslations: TranslationModule,
		option: SlashCommandStringOption): SlashCommandStringOption {
		return option.setName(currentCommandEnglishTranslations.get("optionScopeName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionScopeDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeDescription")
			})
			.addChoices(
				{
					name: currentCommandEnglishTranslations.get("scopes.global"),
					"name_localizations": {
						fr: currentCommandFrenchTranslations.get("scopes.global")
					}, value: TopConstants.GLOBAL_SCOPE
				},
				{
					name: currentCommandEnglishTranslations.get("scopes.server"),
					"name_localizations":
						{
							fr: currentCommandFrenchTranslations.get("scopes.server")
						}
					,
					value: TopConstants.SERVER_SCOPE
				}
			);
	}

	static generateTopPageOption(
		currentCommandFrenchTranslations: TranslationModule,
		currentCommandEnglishTranslations: TranslationModule,
		option: SlashCommandIntegerOption): SlashCommandIntegerOption {
		return option.setName(currentCommandEnglishTranslations.get("optionPageName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPageName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionPageDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPageDescription")
			});
	}
}