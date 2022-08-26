import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import Entity, {Entities} from "../../core/database/game/models/Entity";
import {Constants} from "../../core/Constants";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {draftBotClient} from "../../core/bot";

/**
 * Displays information about a pet
 * @param {CommandInteraction} interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}
	const tr = Translations.getModule("commands.pet", language);

	const pet = askedEntity.Player.Pet;

	if (pet) {
		return await interaction.reply({
			embeds: [new DraftBotEmbed()
				.formatAuthor(tr.get("embedTitle"), interaction.user, draftBotClient.users.cache.get(askedEntity.discordUserId))
				.setDescription(
					pet.getPetDisplay(language)
				)]
		});
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("pet")
		.setDescription("Display information about a pet")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the pet")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the pet")
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};
