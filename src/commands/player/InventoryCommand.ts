import {DraftBotInventoryEmbedBuilder} from "../../core/messages/DraftBotInventoryEmbed";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Shows the inventory of the given player (default player is the one who entered the command)
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}

	await (await new DraftBotInventoryEmbedBuilder(interaction.user, language, askedEntity.Player)
		.build())
		.reply(interaction);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.inventory", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.inventory", Constants.LANGUAGE.ENGLISH);
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
			.setRequired(false)
		)
		.addNumberOption(option => option.setName(currentCommandEnglishTranslations.get("optionRankName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionRankDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionRankDescription")
			})
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
