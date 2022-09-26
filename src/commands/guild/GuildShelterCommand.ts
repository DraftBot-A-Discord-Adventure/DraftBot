import {Entity} from "../../core/database/game/models/Entity";
import {DraftBotShelterMessageBuilder} from "../../core/messages/DraftBotShelterMessage";
import {Guilds} from "../../core/database/game/models/Guild";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Shows the guild's shelter, where all the guild pets are stored
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guild = await Guilds.getById(entity.Player.guildId);
	await interaction.reply({embeds: [await new DraftBotShelterMessageBuilder(guild, language).build()]});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildShelter", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildShelter", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};
