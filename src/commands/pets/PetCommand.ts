import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import Entity, {Entities} from "../../core/database/game/models/Entity";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {draftBotClient} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Displays information about a pet
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}
	const tr = Translations.getModule("commands.pet", language);

	const pet = askedEntity.Player.Pet;

	if (pet) {
		await interaction.reply({
			embeds: [new DraftBotEmbed()
				.formatAuthor(tr.get("embedTitle"), interaction.user, draftBotClient.users.cache.get(askedEntity.discordUserId))
				.setDescription(
					pet.getPetDisplay(language)
				)]
		});
		return;
	}

	if (askedEntity.discordUserId === interaction.user.id) {
		await replyErrorMessage(
			interaction,
			language,
			tr.get("noPet")
		);
	}
	else {
		await replyErrorMessage(
			interaction,
			language,
			tr.get("noPetOther")
		);
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.pet", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.pet", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
