/**
 * Special class for generating SlashCommandBuilder
 */
import {ApplicationCommandOptionBase, SlashCommandBuilder} from "@discordjs/builders";
import i18n from "../translations/i18n";
import {Constants} from "../Constants";
import {SlashCommandStringOption} from "discord.js";
import {TopConstants} from "../../../Lib/src/constants/TopConstants";


export class SlashCommandBuilderGenerator {

	/**
	 * This is used to avoid having to write the same code for each command this method create a base command with a name and a description from the translation modules of the command
	 * @param commandSectionName Command section name in the translation files
	 */
	static generateBaseCommand(commandSectionName: string): SlashCommandBuilder {
		return new SlashCommandBuilder()
			.setName(i18n.t(`discordBuilder:${commandSectionName}.name`, { lng: Constants.LANGUAGE.ENGLISH }))
			.setNameLocalizations({
				fr: i18n.t(`discordBuilder:${commandSectionName}.name`, { lng: Constants.LANGUAGE.FRENCH })
			})
			.setDescription(i18n.t(`discordBuilder:${commandSectionName}.description`, { lng: Constants.LANGUAGE.ENGLISH }))
			.setDescriptionLocalizations({
				fr: i18n.t(`discordBuilder:${commandSectionName}.description`, { lng: Constants.LANGUAGE.FRENCH })
			});
	}

	/**
	 * Generate a generic option
	 * @param commandSectionName Command section name in the translation files
	 * @param optionSectionName Option section name in the translation files
	 * @param option Option to populate
	 */
	static generateOption<T extends ApplicationCommandOptionBase>(commandSectionName: string, optionSectionName: string, option: T): T {
		return option.setName(i18n.t(`discordBuilder:${commandSectionName}.options.${optionSectionName}.name`, { lng: Constants.LANGUAGE.ENGLISH }))
			.setNameLocalizations({
				fr: i18n.t(`discordBuilder:${commandSectionName}.options.${optionSectionName}.name`, { lng: Constants.LANGUAGE.FRENCH })
			})
			.setDescription(i18n.t(`discordBuilder:${commandSectionName}.options.${optionSectionName}.description`, { lng: Constants.LANGUAGE.ENGLISH }))
			.setDescriptionLocalizations({
				fr: i18n.t(`discordBuilder:${commandSectionName}.options.${optionSectionName}.description`, { lng: Constants.LANGUAGE.FRENCH })
			});
	}

	/**
	 * Generate a top scope option
	 * @param commandSectionName
	 * @param optionSectionName
	 * @param option
	 */
	static generateTopScopeOption(
		commandSectionName: string,
		optionSectionName: string,
		option: SlashCommandStringOption): SlashCommandStringOption {
		return SlashCommandBuilderGenerator.generateOption(commandSectionName, optionSectionName, option)
			.addChoices(
				{
					name: i18n.t("discordBuilder:scopes.global", { lng: Constants.LANGUAGE.ENGLISH }),
					"name_localizations": {
						fr: i18n.t("discordBuilder:scopes.global", { lng: Constants.LANGUAGE.FRENCH })
					}, value: TopConstants.GLOBAL_SCOPE
				},
				{
					name: i18n.t("discordBuilder:scopes.server", { lng: Constants.LANGUAGE.ENGLISH }),
					"name_localizations":
						{
							fr: i18n.t("discordBuilder:scopes.server", { lng: Constants.LANGUAGE.FRENCH })
						}
					,
					value: TopConstants.SERVER_SCOPE
				}
			);
	}
}