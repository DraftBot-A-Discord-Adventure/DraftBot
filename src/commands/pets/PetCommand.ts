import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import Entity, {Entities} from "../../core/models/Entity";
import {Constants} from "../../core/Constants";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";

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
	const tr = Translations.getModule("commands.myPet", language);

	const pet = askedEntity.Player.Pet;

	if (pet) {
		return await interaction.reply({
			embeds: [new DraftBotEmbed()
				.setAuthor(
					tr.format("embedTitle", {
						pseudo: await entity.Player.getPseudo(language)
					}),
					interaction.user.displayAvatarURL()
				)
				.setDescription(
					pet.getPetDisplay(language)
				)]
		});
	}

	if (askedEntity.discordUserId === interaction.user.id) {
		await sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			tr.get("noPet"),
			false,
			interaction
		);
	}
	else {
		await sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			tr.get("noPetOther"),
			false,
			interaction
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
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
