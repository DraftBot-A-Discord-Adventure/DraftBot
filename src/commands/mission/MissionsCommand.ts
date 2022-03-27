import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Entities, Entity} from "../../core/models/Entity";
import {Campaign} from "../../core/missions/Campaign";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";
import {draftBotClient} from "../../core/bot";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedErrorInteraction} from "../../core/utils/ErrorUtils";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	let entityToLook = await Entities.getByOptions(interaction);
	let userToPrint = interaction.user;
	if (entityToLook !== null) {
		userToPrint = await draftBotClient.users.fetch(entityToLook.discordUserId);
	}
	else {
		entityToLook = entity;
	}

	await MissionsController.update(entity.discordUserId, interaction.channel, language, "commandMission");
	entity = await Entities.getById(entity.id);

	await Campaign.updateCampaignAndSendMessage(entity, interaction.channel, language);
	if (entityToLook.discordUserId === entity.discordUserId) {
		[entityToLook] = await Entities.getOrRegister(entityToLook.discordUserId);
	}
	await interaction.reply({
		embeds: [
			await new DraftBotMissionsMessageBuilder(
				entityToLook.Player,
				userToPrint,
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
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.HIGH
};
