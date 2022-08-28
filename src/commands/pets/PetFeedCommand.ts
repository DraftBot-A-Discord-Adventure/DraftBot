import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/database/game/models/Entity";
import {Guilds} from "../../core/database/game/models/Guild";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import PetEntity from "../../core/database/game/models/PetEntity";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";

/**
 * Feed your pet !
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const petFeedModule = Translations.getModule("commands.petFeed", language);
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const authorPet = entity.Player.Pet;
	if (!authorPet) {
		await replyErrorMessage(
			interaction,
			language,
			petFeedModule.get("noPet")
		);
		return;
	}

	const cooldownTime = entity.Player.Pet.getFeedCooldown();
	if (cooldownTime > 0) {
		await replyErrorMessage(
			interaction,
			language,
			petFeedModule.format("notHungry", {
				petnick: authorPet.displayName(language)
			})
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
 * Sends PetFeed Message and prepare the corresponding collector
 * @param interaction
 * @param feedEmbed
 * @param entity
 */
async function sendPetFeedMessageAndPrepareCollector(interaction: CommandInteraction, feedEmbed: DraftBotEmbed, entity: Entity) {
	const feedMsg = await interaction.reply({embeds: [feedEmbed], fetchReply: true}) as Message;

	const filterConfirm = (reaction: MessageReaction, user: User) => user.id === entity.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.PET_FEED, collector);
	return {feedMsg, collector};
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

	const {feedMsg, collector} = await sendPetFeedMessageAndPrepareCollector(interaction, feedEmbed, entity);

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		if (
			!reaction.first() ||
			reaction.first().emoji.name === Constants.MENU_REACTION.DENY
		) {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.PET_FEED);
			return await sendErrorMessage(
				interaction.user,
				interaction,
				language,
				petFeedModule.get("cancelFeed"),
				true
			);
		}

		if (foodItems.has(reaction.first().emoji.name)) {
			const item = foodItems.get(reaction.first().emoji.name);
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.PET_FEED);
			await feedPet(interaction, language, entity, authorPet, item, petFeedModule);
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
	feedEmbed.setFooter({text: petFeedModule.get("feedEmbedFooter")});

	const {feedMsg, collector} = await sendPetFeedMessageAndPrepareCollector(interaction, feedEmbed, entity);

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.PET_FEED);
		if (
			!reaction.first() ||
			reaction.first().emoji.name === Constants.MENU_REACTION.DENY
		) {
			return await sendErrorMessage(
				interaction.user,
				interaction,
				language,
				petFeedModule.get("cancelFeed"),
				true
			);
		}

		if (entity.Player.money - 20 < 0) {
			return await sendErrorMessage(
				interaction.user,
				interaction,
				language,
				petFeedModule.get("noMoney")
			);
		}
		await entity.Player.addMoney(entity, -20, interaction.channel, language, NumberChangeReason.PET_FEED);
		authorPet.hungrySince = new Date();
		await authorPet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[getFoodIndexOf("commonFood")], entity, interaction.channel, language, NumberChangeReason.PET_FEED);
		await Promise.all([
			authorPet.save(),
			entity.Player.save()
		]);
		const feedSuccessEmbed = new DraftBotEmbed();
		feedSuccessEmbed.setDescription(petFeedModule.format("description.commonFood", {
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
		return await sendErrorMessage(
			interaction.user,
			interaction,
			language,
			petFeedModule.get("notEnoughFood")
		);
	}
	const foodIndex = getFoodIndexOf(item);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("embedTitle"), interaction.user);
	guild.removeFood(item, -1, NumberChangeReason.PET_FEED);

	if (
		pet.PetModel.diet &&
		(item === Constants.PET_FOOD.HERBIVOROUS_FOOD || item === Constants.PET_FOOD.CARNIVOROUS_FOOD)
	) {
		if (item.includes(pet.PetModel.diet)) {
			await pet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[foodIndex], entity, interaction.channel, language, NumberChangeReason.PET_FEED);
		}
		successEmbed.setDescription(
			petFeedModule.format("description." + (item.includes(pet.PetModel.diet) ? "dietFoodSuccess" : "dietFoodFail"), {
				petnick: pet.displayName(language),
				typeSuffix: pet.sex === Constants.PETS.FEMALE ? "se" : "x"
			})
		);
	}
	else {
		await pet.changeLovePoints(Constants.PET_FOOD_GUILD_SHOP.EFFECT[foodIndex], entity, interaction.channel, language, NumberChangeReason.PET_FEED);
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
		allowEffects: [Constants.EFFECT.SMILEY]
	},
	mainGuildCommand: false
};

