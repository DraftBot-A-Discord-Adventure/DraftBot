import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/database/game/models/Entity";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {Data} from "../../core/Data";
import {TranslationModule, Translations} from "../../core/Translations";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";

/**
 * Add a food storage field for storage embeds
 * @param {DraftBotEmbed} storageEmbed
 * @param {TranslationModule} translations
 * @param {TranslationModule} foodModule
 * @param {Guild} guild
 * @param {string} food
 */
function addFoodStorageField(storageEmbed: DraftBotEmbed, translations: TranslationModule, foodModule: TranslationModule, guild: Guild, food: string): void {
	const foodIndex = getFoodIndexOf(food);
	storageEmbed.addField(
		translations.format("foodTitle", {
			foodType: foodModule.get(food + ".name"),
			emote: Constants.PET_FOOD_GUILD_SHOP.EMOTE[foodIndex]
		}),
		translations.format("foodField", {
			guildFood: guild.getDataValue(food),
			maxFood: Constants.GUILD.MAX_PET_FOOD[foodIndex]
		}),
		true
	);
}

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
	for (const food of Constants.PET_FOOD_GUILD_SHOP.TYPE) {
		addFoodStorageField(storageEmbed, translations, foodModule, guild, food);
	}

	await interaction.reply({embeds: [storageEmbed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildstorage")
		.setDescription("Displays the guild's storage"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};