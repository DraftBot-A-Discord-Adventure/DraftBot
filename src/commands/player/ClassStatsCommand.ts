import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Classes} from "../../core/models/Class";
import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";

/**
 * Display information about classes
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const classTranslations = Translations.getModule("commands.classStats", language);
	const classesLineDisplay = [];
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	for (let k = 0; k < allClasses.length; k++) {
		classesLineDisplay.push(allClasses[k].toString(language, entity.Player.level));
	}

	// Creating classstats message
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(classTranslations.get("title"))
				.setDescription(classTranslations.get("desc"))
				.addField(
					"\u200b", classesLineDisplay.join("\n")
				)]
	}
	);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("classstats")
		.setDescription("Display the stats you could have for each class"),
	executeCommand,
	requirements: {
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};