import {DraftBotInventoryEmbedBuilder} from "../../core/messages/DraftBotInventoryEmbed";
import {Entities, Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../core/Constants";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}

	await (await new DraftBotInventoryEmbedBuilder(interaction.user, language, askedEntity.Player)
		.build())
		.reply(interaction);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("inventory")
		.setDescription("Displays the inventory of a player")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the inventory")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the inventory")
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
	registerPriority: CommandRegisterPriority.NORMAL
};
