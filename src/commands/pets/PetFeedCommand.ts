import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {
	CacheType,
	CommandInteraction,
	GuildCacheMessage,
	Message,
	MessageReaction,
	ReactionCollector,
	User
} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import PetEntity, {PetEntities} from "../../core/database/game/models/PetEntity";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {Pet, Pets} from "../../core/database/game/models/Pet";

/**
 * Obtiens la guilde du joueur
 * @param player
 */
async function getGuild(player: Player): Promise<Guild> {
	try {
		return await Guilds.getById(player.guildId);
	}
	catch (error) {
		return null;
	}
}

/**
 * Get all food items to use to make the petfeed embed
 */
function getFoodItems(): Map<string, string> {
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
 * @param player
 */
async function sendPetFeedMessageAndPrepareCollector(
	interaction: CommandInteraction,
	feedEmbed: DraftBotEmbed,
	player: Player
): Promise<{ feedMsg: Message, collector: ReactionCollector }> {
	const feedMsg = await interaction.reply({embeds: [feedEmbed], fetchReply: true}) as Message;

	const filterConfirm = (reaction: MessageReaction, user: User): boolean => user.id === player.discordUserId && reaction.me;

	const collector = feedMsg.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.PET_FEED, collector);
	return {feedMsg, collector};
}

/**
 * Allow a user without guild to feed his pet with some candies
 * @param language
 * @param interaction
 * @param player
 * @param authorPet
 * @param petModel
 * @param petFeedModule
 * @returns {Promise<void>}
 */
async function withoutGuildPetFeed(language: string, interaction: CommandInteraction, player: Player, authorPet: PetEntity, petModel: Pet, petFeedModule: TranslationModule): Promise<void> {
	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("feedEmbedTitle2"), interaction.user);
	feedEmbed.setDescription(
		petFeedModule.format("feedEmbedDescription2", {
			petnick: authorPet.displayName(petModel, language)
		})
	);
	feedEmbed.setFooter({text: petFeedModule.get("feedEmbedFooter")});

	const {feedMsg, collector} = await sendPetFeedMessageAndPrepareCollector(interaction, feedEmbed, player);

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PET_FEED);
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

		if (player.money - 20 < 0) {
			return await sendErrorMessage(
				interaction.user,
				interaction,
				language,
				petFeedModule.get("noMoney")
			);
		}
		const editValueChanges = {
			player,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.PET_FEED
		};
		await player.addMoney(Object.assign(editValueChanges, {
			amount: -20
		}));
		authorPet.hungrySince = new Date();
		await authorPet.changeLovePoints(Object.assign(editValueChanges, {
			amount: Constants.PET_FOOD_GUILD_SHOP.EFFECT[getFoodIndexOf("commonFood")]
		}));
		await Promise.all([
			authorPet.save(),
			player.save()
		]);
		const feedSuccessEmbed = new DraftBotEmbed();
		feedSuccessEmbed.setDescription(petFeedModule.format("description.commonFood", {
			petnick: authorPet.displayName(petModel, language),
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
 * @param {*} player
 * @param {*} pet
 * @param petModel
 * @param {*} item
 * @param petFeedModule
 */
// eslint-disable-next-line max-params
async function feedPet(
	interaction: CommandInteraction,
	language: string,
	player: Player,
	pet: PetEntity,
	petModel: Pet,
	item: string,
	petFeedModule: TranslationModule
): Promise<GuildCacheMessage<CacheType>> {
	const guild = await Guilds.getById(player.guildId);
	if (guild.getDataValue(item) <= 0) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			language,
			petFeedModule.get("notEnoughFood")
		);
		return;
	}
	const foodIndex = getFoodIndexOf(item);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("embedTitle"), interaction.user);
	guild.removeFood(item, 1, NumberChangeReason.PET_FEED);
	const editValueChanges = {
		player,
		amount: Constants.PET_FOOD_GUILD_SHOP.EFFECT[foodIndex],
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.PET_FEED
	};
	if (
		petModel.diet &&
		(item === Constants.PET_FOOD.HERBIVOROUS_FOOD || item === Constants.PET_FOOD.CARNIVOROUS_FOOD)
	) {
		if (item.includes(petModel.diet)) {
			await pet.changeLovePoints(editValueChanges);
		}
		successEmbed.setDescription(
			petFeedModule.format(`description.${item.includes(petModel.diet) ? "dietFoodSuccess" : "dietFoodFail"}`, {
				petnick: pet.displayName(petModel, language),
				typeSuffix: pet.sex === Constants.PETS.FEMALE ? "se" : "x"
			})
		);
	}
	else {
		await pet.changeLovePoints(editValueChanges);
		successEmbed.setDescription(
			petFeedModule.format(`description.${item}`, {
				petnick: pet.displayName(petModel, language),
				typeSuffix: pet.sex === Constants.PETS.FEMALE ? "se" : "x"
			})
		);
	}
	pet.hungrySince = new Date();
	await Promise.all([pet.save(), guild.save()]);
	return interaction.followUp({embeds: [successEmbed]});
}

/**
 * Allow a user in a guild to give some food to his pet
 * @param language
 * @param interaction
 * @param player
 * @param authorPet
 * @param petModel
 * @param petFeedModule
 * @returns {Promise<void>}
 */
async function guildUserFeedPet(language: string, interaction: CommandInteraction, player: Player, authorPet: PetEntity, petModel: Pet, petFeedModule: TranslationModule): Promise<void> {
	const foodItems = getFoodItems();

	const feedEmbed = new DraftBotEmbed()
		.formatAuthor(petFeedModule.get("feedEmbedAuthor"), interaction.user);
	feedEmbed.setDescription(
		petFeedModule.get("feedEmbedDescription")
	);

	const {feedMsg, collector} = await sendPetFeedMessageAndPrepareCollector(interaction, feedEmbed, player);

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		if (
			!reaction.first() ||
			reaction.first().emoji.name === Constants.MENU_REACTION.DENY
		) {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PET_FEED);
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
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PET_FEED);
			await feedPet(interaction, language, player, authorPet, petModel, item, petFeedModule);
		}
	});

	for (const foodEmote of Constants.PET_FOOD_GUILD_SHOP.EMOTE) {
		await feedMsg.react(foodEmote);
	}
	await feedMsg.react(Constants.MENU_REACTION.DENY);
}

/**
 * Feed your pet !
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const petFeedModule = Translations.getModule("commands.petFeed", language);
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const authorPet = await PetEntities.getById(player.petId);
	if (!authorPet) {
		await replyErrorMessage(
			interaction,
			language,
			petFeedModule.get("noPet")
		);
		return;
	}

	const petModel = await Pets.getById(authorPet.petId);
	const cooldownTime = authorPet.getFeedCooldown(petModel);
	if (cooldownTime > 0) {
		await replyErrorMessage(
			interaction,
			language,
			petFeedModule.format("notHungry", {
				petnick: authorPet.displayName(petModel, language)
			})
		);
		return;
	}

	const guild = await getGuild(player);
	if (guild === null) {
		await withoutGuildPetFeed(language, interaction, player, authorPet, petModel, petFeedModule);
	}
	else {
		await guildUserFeedPet(language, interaction, player, authorPet, petModel, petFeedModule);
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.petFeed", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.petFeed", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};
