import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandRegisterPriority} from "../CommandRegisterPriority";
import {Data} from "../../core/Data";
import {Translations} from "../../core/Translations";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Display the storage of the guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const foodModule = Translations.getModule("food", language);
	const translations = Translations.getModule("commands.guildStorage", language);
	const guild = await Guilds.getById(entity.Player.guildId);

	const storageEmbed = new DraftBotEmbed();

	storageEmbed.setTitle(
		translations.format("embedTitle", {
			guild: guild.name
		})
	);

	storageEmbed.setThumbnail(Data.getModule("commands.guild").getString("icon"));

	storageEmbed.addField(
		translations.get("fieldDescKey"),
		translations.get("fieldDescValue")
	);
	storageEmbed.addField(
		translations.format("foodTitle", {
			foodType: foodModule.get("commonFood.name"),
			emote: Constants.PET_FOOD.EMOTE[0]
		}),
		translations.format("foodField", {
			guildFood: guild.commonFood,
			maxFood: Constants.GUILD.MAX_COMMON_PET_FOOD
		}),
		true
	);
	storageEmbed.addField(
		translations.format("foodTitle", {
			foodType: foodModule.get("herbivorousFood.name"),
			emote: Constants.PET_FOOD.EMOTE[1]
		}),
		translations.format("foodField", {
			guildFood: guild.herbivorousFood,
			maxFood: Constants.GUILD.MAX_HERBIVOROUS_PET_FOOD
		}),
		true
	);
	storageEmbed.addField(
		translations.format("foodTitle", {
			foodType: foodModule.get("carnivorousFood.name"),
			emote: Constants.PET_FOOD.EMOTE[2]
		}),
		translations.format("foodField", {
			guildFood: guild.carnivorousFood,
			maxFood: Constants.GUILD.MAX_CARNIVOROUS_PET_FOOD
		}),
		true
	);
	storageEmbed.addField(
		translations.format("foodTitle", {
			foodType: foodModule.get("ultimateFood.name"),
			emote: Constants.PET_FOOD.EMOTE[3]
		}),
		translations.format("foodField", {
			guildFood: guild.ultimateFood,
			maxFood: Constants.GUILD.MAX_ULTIMATE_PET_FOOD
		}),
		true
	);

	await interaction.reply({embeds: [storageEmbed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildstorage")
		.setDescription("Displays the guild's storage"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: true,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOW
};