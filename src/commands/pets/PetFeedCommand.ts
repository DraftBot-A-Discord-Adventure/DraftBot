import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import PetEntity from "../../core/models/PetEntity";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";

/**
 * Feed your pet !
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const petFeedModule = Translations.getModule("commands.petFeed", language);
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}

	const authorPet = entity.Player.Pet;
	if (!authorPet) {
		await sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			petFeedModule.get("noPet"),
			false,
			interaction
		);
		return;
	}

	const cooldownTime = entity.Player.Pet.getFeedCooldown();
	if (cooldownTime > 0) {
		await sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			petFeedModule.format("notHungry", {
				petnick: authorPet.displayName(language)
			}),
			false,
			interaction
		);
		return;
	}

	const guild = await getGuild(entity);
	if (guild === null) {
		await withoutGuildPetFeed(language, interaction, entity, authorPet, petFeedModule);
	}
	else {
		await guildUserFeedPet(language, interaction, entity, authorPet, petFeedModule);
	}
}

/**
 * Obtiens la guilde du joueur
 * @param entity
 */
async function getGuild(entity: Entity) {
	try {
		return await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		return null;
	}
}

/**
 * Get all food items to use to make the petfeed embed
 */
function getFoodItems() {
	const foodItems = new Map<string, string>();
	for (const foodItem of Constants.PET_FOOD_GUILD_SHOP.TYPE) {
		foodItems.set(Constants.PET_FOOD_GUILD_SHOP.EMOTE[getFoodIndexOf(foodItem)], foodItem);
	}
	return foodItems;
}

/**
 * Allow a user in a guild to give some food to his pet
 * @param language
 * @param interaction
 * @param entity
 * @param authorPet
 * @param petFeedModule
 * @returns {Promise<void>}
 */
async function guildUserFeedPet(language: string, interaction: CommandInteraction, entity: Entity, authorPet: PetEntity, petFeedModule: TranslationModule) {
	const foodItems = getFoodItems();

	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("feedEmbedAuthor"), interaction.user);
	feedEmbed.setDescription(
		petFeedModule.get("feedEmbedDescription")
	);

	const feedMsg = await interaction.reply({embeds: [feedEmbed], fetchReply: true}) as Message;

	const filterConfirm = (reaction: MessageReaction, user: User) => user.id === entity.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayer(entity.discordUserId, "petFeed");

	// Fetch the choice from the user
	collector.on("end", (reaction) => {
		if (
			!reaction.first() ||
			reaction.first().emoji.name === Constants.MENU_REACTION.DENY
		) {
			BlockingUtils.unblockPlayer(entity.discordUserId);
			return sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				petFeedModule.get("cancelFeed"),
				true
			);
		}

		if (foodItems.has(reaction.first().emoji.name)) {
			const item = foodItems.get(reaction.first().emoji.name);
			BlockingUtils.unblockPlayer(entity.discordUserId);
			feedPet(interaction, language, entity, authorPet, item, petFeedModule);
		}
	});

	for (const foodEmote of Constants.PET_FOOD_GUILD_SHOP.EMOTE) {
		await feedMsg.react(foodEmote);
	}
	await feedMsg.react(Constants.MENU_REACTION.DENY);
}

/**
 * Allow a user without guild to feed his pet with some candies
 * @param language
 * @param interaction
 * @param entity
 * @param authorPet
 * @param petFeedModule
 * @returns {Promise<void>}
 */
async function withoutGuildPetFeed(language: string, interaction: CommandInteraction, entity: Entity, authorPet: PetEntity, petFeedModule: TranslationModule) {
	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("feedEmbedTitle2"), interaction.user);
	feedEmbed.setDescription(
		petFeedModule.format("feedEmbedDescription2", {
			petnick: authorPet.displayName(language)
		})
	);
	feedEmbed.setFooter(petFeedModule.get("feedEmbedFooter"));

	const feedMsg = await interaction.reply({embeds: [feedEmbed], fetchReply: true}) as Message;

	const filterConfirm = (reaction: MessageReaction, user: User) => user.id === entity.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayer(entity.discordUserId, "petFeed");

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		BlockingUtils.unblockPlayer(entity.discordUserId);
		if (
			!reaction.first() ||
			reaction.first().emoji.name === Constants.MENU_REACTION.DENY
		) {
			return sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				petFeedModule.get("cancelFeed"),
				true
			);
		}

		if (entity.Player.money - 20 < 0) {
			return sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				petFeedModule.get("noMoney")
			);
		}
		await entity.Player.addMoney(entity, -20, interaction.channel, language);
		authorPet.hungrySince = new Date();
		await authorPet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[getFoodIndexOf("commonFood")], entity.discordUserId, interaction.channel, language);
		await Promise.all([
			authorPet.save(),
			entity.Player.save()
		]);
		const feedSuccessEmbed = new DraftBotEmbed();
		feedSuccessEmbed.setDescription(petFeedModule.format("description.1", {
			petnick: authorPet.displayName(language),
			typeSuffix: authorPet.sex === Constants.PETS.FEMALE ? "se" : "x"
		}));

		return interaction.followUp({embeds: [feedSuccessEmbed]});
	});

	await Promise.all([
		feedMsg.react(Constants.MENU_REACTION.ACCEPT),
		feedMsg.react(Constants.MENU_REACTION.DENY)
	]);
}

/**
 * feed the pet
 * @param interaction
 * @param {fr/en} language
 * @param {*} entity
 * @param {*} pet
 * @param {*} item
 * @param petFeedModule
 */
async function feedPet(interaction: CommandInteraction, language: string, entity: Entity, pet: PetEntity, item: string, petFeedModule: TranslationModule) {
	const guild = await Guilds.getById(entity.Player.guildId);
	if (guild.getDataValue(item) <= 0) {
		return sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			petFeedModule.get("notEnoughFood")
		);
	}
	const foodIndex = getFoodIndexOf(item);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("embedTitle"), interaction.user);
	guild.setDataValue(item, guild.getDataValue(item) - 1);

	if (
		pet.PetModel.diet &&
		(item === Constants.PET_FOOD.HERBIVOROUS_FOOD || item === Constants.PET_FOOD.CARNIVOROUS_FOOD)
	) {
		if (item.includes(pet.PetModel.diet)) {
			await pet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[foodIndex], entity.discordUserId, interaction.channel, language);
		}
		successEmbed.setDescription(
			petFeedModule.format("description." + (item.includes(pet.PetModel.diet) ? "dietFoodSuccess" : "dietFoodFail"), {
				petnick: pet.displayName(language),
				typeSuffix: pet.sex === Constants.PETS.FEMALE ? "se" : "x"
			})
		);
	}
	else {
		await pet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[foodIndex], entity.discordUserId, interaction.channel, language);
		successEmbed.setDescription(
			petFeedModule.format("description." + item, {
				petnick: pet.displayName(language),
				typeSuffix: pet.sex === Constants.PETS.FEMALE ? "se" : "x"
			})
		);
	}
	pet.hungrySince = new Date();
	await Promise.all([pet.save(), guild.save()]);
	return interaction.followUp({embeds: [successEmbed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("petfeed")
		.setDescription("Feed your pet with the guild's food or your personnal food"),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY],
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};

