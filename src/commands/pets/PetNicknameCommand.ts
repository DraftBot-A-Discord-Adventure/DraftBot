import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../core/Constants";
import {CommandRegisterPriority} from "../CommandRegisterPriority";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {Translations} from "../../core/Translations";
import {checkNameString} from "../../core/utils/StringUtils";

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction.user, interaction.channel, language, interaction)) {
		return;
	}
	const pet = entity.Player.Pet;
	const petNickTranslations = Translations.getModule("commands.petNickname", language);
	if (!pet) {
		await sendErrorMessage(interaction.user, interaction.channel, language, Translations.getModule("commands.pet", language).get("noPet"), false, interaction);
		return;
	}
	const petNickname = interaction.options.getString("name");
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(petNickTranslations.get("successTitle"), interaction.user);
	if (petNickname === null) {
		successEmbed.setDescription(petNickTranslations.get("successNoName"));
	}
	else {
		if (!checkNameString(petNickname, Constants.PETS.NICKNAME_MIN_LENGTH, Constants.PETS.NICKNAME_MAX_LENGTH)) {
			await sendErrorMessage(interaction.user, interaction.channel, language,
				petNickTranslations.get("invalidName") + "\n" +
				Translations.getModule("error", language).format("nameRules", {
					min: Constants.PETS.NICKNAME_MIN_LENGTH,
					max: Constants.PETS.NICKNAME_MAX_LENGTH
				}),false,interaction);
			return;
		}
		successEmbed.setDescription(petNickTranslations.format("success", {
			name: petNickname
		}));
	}

	pet.nickname = petNickname;
	await pet.save();
	await interaction.reply({embeds: [successEmbed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("petnickname")
		.setDescription("Change the nickname of your pet")
		.addStringOption(option => option.setName("name")
			.setDescription("The new name you want to give to the pet")
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
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOW
};
