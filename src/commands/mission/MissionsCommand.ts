import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedError} from "../../core/utils/BlockingUtils";

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	let entityToLook = await Entities.getByOptions(interaction);
	if (entityToLook === null) {
		entityToLook = entity;
	}

	if (interaction.user.id === entityToLook.discordUserId) {
		await MissionsController.update(entity, interaction.channel, language, {missionId: "commandMission"});
	}
	entity = await Entities.getById(entity.id);

	await MissionsController.checkCompletedMissions(entity, interaction.channel, language);
	if (entityToLook.discordUserId === entity.discordUserId) {
		[entityToLook] = await Entities.getOrRegister(entityToLook.discordUserId);
	}
	await interaction.reply({
		embeds: [
			await new DraftBotMissionsMessageBuilder(
				entityToLook,
				interaction.user,
				language
			).build()
		]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("missions")
		.setDescription("Displays the missions of a player")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the inventory")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the inventory")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};
