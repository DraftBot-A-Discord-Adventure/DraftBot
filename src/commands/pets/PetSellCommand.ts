import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {escapeUsername} from "../../core/utils/StringUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {PetSellConstants} from "../../core/constants/PetSellConstants";
import PetEntity, {PetEntities} from "../../core/database/game/models/PetEntity";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {
	BroadcastTranslationModuleLike,
	DraftBotBroadcastValidationMessage
} from "../../core/messages/DraftBotBroadcastValidationMessage";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {Pet, Pets} from "../../core/database/game/models/Pet";
import {NumberChangeReason} from "../../core/constants/LogsConstants";

type TextInformation = { interaction: CommandInteraction, petSellModule: TranslationModule };
type SellerInformation = { player: Player, pet: PetEntity, petModel: Pet, guild: Guild, petCost: number };
type BuyerInformation = { buyer: Player, user: User };

/**
 * Check if the requirements for selling the pet are fulfilled
 * @param textInformation
 * @param sellerInformation
 */
async function missingRequirementsToSellPet(textInformation: TextInformation, sellerInformation: SellerInformation): Promise<boolean> {
	if (!sellerInformation.pet) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.petSellModule.language,
			Translations.getModule("commands.pet", textInformation.petSellModule.language).get("noPet")
		);
		return true;
	}

	if (sellerInformation.pet.isFeisty()) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.petSellModule.language,
			textInformation.petSellModule.get("isFeisty")
		);
		return true;
	}

	if (sellerInformation.petCost < PetSellConstants.SELL_PRICE_MIN || sellerInformation.petCost > PetSellConstants.SELL_PRICE_MAX) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.petSellModule.language,
			textInformation.petSellModule.format("badPrice", {
				minPrice: PetSellConstants.SELL_PRICE_MIN,
				maxPrice: PetSellConstants.SELL_PRICE_MAX
			})
		);
		return true;
	}

	if (sellerInformation.guild.isAtMaxLevel()) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.petSellModule.language,
			textInformation.petSellModule.get("guildAtMaxLevel")
		);
		return true;
	}

	return false;
}

/**
 * calculate the amount of xp the guild will receive from the price chosen by the user
 * @param petCost
 */
function calculateAmountOfXPToAdd(petCost: number): number {
	return Math.floor(RandomUtils.randInt(
		Math.floor(petCost / PetSellConstants.MIN_XP_DIVIDER),
		Math.floor(petCost / PetSellConstants.MAX_XP_DIVIDER) + 1
	));
}

/**
 * Does the action of selling the pet from the seller to the buyer
 * @param buyerInformation
 * @param sellerInformation
 * @param textInformation
 */
async function executeTheTransaction(
	buyerInformation: BuyerInformation,
	sellerInformation: SellerInformation,
	textInformation: TextInformation
): Promise<void> {
	const buyerGuild = await Guilds.getById(buyerInformation.buyer.guildId);
	if (buyerGuild && buyerGuild.id === sellerInformation.guild.id) {
		await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.get("sameGuild"));
		return;
	}
	const buyerPet = await PetEntities.getById(buyerInformation.buyer.petId);
	if (buyerPet) {
		await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.get("havePet"));
		return;
	}
	if (sellerInformation.petCost > buyerInformation.buyer.money) {
		await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.get("noMoney"));
		return;
	}
	const xpToAdd = calculateAmountOfXPToAdd(sellerInformation.petCost);
	await sellerInformation.guild.addExperience(xpToAdd, textInformation.interaction.channel, textInformation.petSellModule.language, NumberChangeReason.PET_SELL);
	buyerInformation.buyer.petId = sellerInformation.pet.id;
	sellerInformation.player.petId = null;
	sellerInformation.pet.lovePoints = Constants.PETS.BASE_LOVE;
	// the money has to be edited before the player is saved to avoid cross writing to the database
	await buyerInformation.buyer.addMoney({
		amount: -sellerInformation.petCost,
		channel: textInformation.interaction.channel,
		language: textInformation.petSellModule.language,
		reason: NumberChangeReason.PET_SELL
	});
	await Promise.all([
		sellerInformation.guild.save(),
		buyerInformation.buyer.save(),
		sellerInformation.player.save(),
		sellerInformation.pet.save()
	]);
	if (!sellerInformation.guild.isAtMaxLevel()) {
		const guildXpEmbed = new DraftBotEmbed();
		const gdModule = Translations.getModule("commands.guildDaily", textInformation.petSellModule.language);
		guildXpEmbed.setTitle(
			gdModule.format("rewardTitle", {
				guildName: sellerInformation.guild.name
			})
		);
		guildXpEmbed.setDescription(
			gdModule.format("guildXP", {
				xp: xpToAdd
			})
		);
		textInformation.interaction.followUp({embeds: [guildXpEmbed]}).then();
	}
	const addPetEmbed = new DraftBotEmbed()
		.formatAuthor(textInformation.petSellModule.get("addPetEmbed.author"), buyerInformation.user)
		.setDescription(
			textInformation.petSellModule.format("addPetEmbed.description", {
				emote: sellerInformation.pet.getPetEmote(sellerInformation.petModel),
				pet: sellerInformation.pet.nickname ? sellerInformation.pet.nickname : sellerInformation.pet.getPetTypeName(sellerInformation.petModel, textInformation.petSellModule.language)
			})
		);
	await textInformation.interaction.followUp({embeds: [addPetEmbed]});
	LogsDatabase.logPetSell(sellerInformation.pet, sellerInformation.player.discordUserId, buyerInformation.user.id, sellerInformation.petCost).then();
	await MissionsController.update(buyerInformation.buyer, textInformation.interaction.channel, textInformation.petSellModule.language, {missionId: "havePet"});
	await MissionsController.update(sellerInformation.player, textInformation.interaction.channel, textInformation.petSellModule.language, {missionId: "sellOrTradePet"});
}

/**
 * Manage the confirmation of the potential buyer
 * @param textInformation
 * @param sellerInformation
 * @param buyerInformation
 */
async function petSell(
	textInformation: TextInformation,
	sellerInformation: SellerInformation,
	buyerInformation: BuyerInformation
): Promise<void> {
	BlockingUtils.unblockPlayer(sellerInformation.player.discordUserId, BlockingConstants.REASONS.PET_SELL);
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(textInformation.petSellModule.get("confirmEmbed.author"), buyerInformation.user)
		.setDescription(
			textInformation.petSellModule.format("confirmEmbed.description", {
				emote: sellerInformation.pet.getPetEmote(sellerInformation.petModel),
				pet: sellerInformation.pet.nickname ? sellerInformation.pet.nickname : sellerInformation.pet.getPetTypeName(sellerInformation.petModel, textInformation.petSellModule.language),
				price: sellerInformation.petCost
			})
		);

	const confirmMessage = await textInformation.interaction.followUp({
		embeds: [confirmEmbed],
		fetchReply: true
	}) as Message;

	const confirmCollector = confirmMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => user.id === buyerInformation.buyer.discordUserId &&
			reaction.me &&
			(reaction.emoji.name === Constants.MENU_REACTION.ACCEPT ||
				reaction.emoji.name === Constants.MENU_REACTION.DENY),
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(buyerInformation.buyer.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM, confirmCollector);
	BlockingUtils.blockPlayerWithCollector(sellerInformation.player.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM, confirmCollector);
	confirmCollector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			confirmCollector.stop();
			await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.get("sellCancelled"), true);
			return;
		}
		if (reaction.emoji.name === Constants.MENU_REACTION.ACCEPT) {
			confirmCollector.stop();
			await executeTheTransaction(buyerInformation, sellerInformation, textInformation);
		}
	});
	confirmCollector.on("end", async (reaction) => {
		if (!reaction.first()) {
			await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.get("sellCancelled"), true);
		}
		BlockingUtils.unblockPlayer(buyerInformation.buyer.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM);
		BlockingUtils.unblockPlayer(sellerInformation.player.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM);
	});
	await Promise.all([confirmMessage.react(Constants.MENU_REACTION.ACCEPT), confirmMessage.react(Constants.MENU_REACTION.DENY)]);
}

/**
 * executed when a potential buyer react to the message
 * @param sellerInformation
 * @param textInformation
 */
function getAcceptCallback(sellerInformation: SellerInformation, textInformation: TextInformation): (user: User) => Promise<boolean> {
	return async (user: User): Promise<boolean> => {
		const buyerInformation = {user, buyer: await Players.getByDiscordUserId(user.id)};
		if (buyerInformation.buyer.effect === EffectsConstants.EMOJI_TEXT.BABY ||
			await sendBlockedError(textInformation.interaction, textInformation.petSellModule.language, buyerInformation.user)) {
			buyerInformation.buyer = null;
			return false;
		}
		await petSell(textInformation, sellerInformation, buyerInformation);
		return true;
	};
}

/**
 * get the display message corresponding to the errors that can occur
 * @param petSellModule
 */
function getBroadcastErrorStrings(petSellModule: TranslationModule): BroadcastTranslationModuleLike {
	return {
		errorBroadcastCancelled: petSellModule.get("sellCancelled"),
		errorSelfAccept: petSellModule.get("errors.canSellYourself"),
		errorSelfAcceptSpam: petSellModule.get("errors.spam"),
		errorOtherDeny: petSellModule.get("errors.onlyInitiator"),
		errorNoAnswer: petSellModule.get("errors.noOneAvailable")
	};
}

/**
 * Broadcast a sell request of the player's pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petSellModule = Translations.getModule("commands.petSell", language);

	const petCost = interaction.options.get(Translations.getModule("commands.petSell", Constants.LANGUAGE.ENGLISH).get("optionPriceName")).value as number;
	const pet = await PetEntities.getById(player.petId);
	if (!pet) {
		await replyErrorMessage(interaction, language, Translations.getModule("commands.pet", language).get("noPet"));
		return;
	}
	const petModel = await Pets.getById(pet.petId);
	let guild;
	try {
		guild = await Guilds.getById(player.guildId);
	}
	catch (error) {
		guild = null;
	}
	if (guild === null) {
		// not in a guild
		await replyErrorMessage(
			interaction,
			petSellModule.language,
			Translations.getModule("bot", petSellModule.language).get("notInAGuild")
		);
		return;
	}

	const textInformation = {interaction, petSellModule};
	const sellerInformation = {player: player, pet, petModel, guild, petCost};

	if (await missingRequirementsToSellPet(textInformation, sellerInformation)) {
		return;
	}

	await new DraftBotBroadcastValidationMessage(
		interaction,
		language,
		getAcceptCallback(sellerInformation, textInformation),
		BlockingConstants.REASONS.PET_SELL,
		getBroadcastErrorStrings(petSellModule))
		.setTitle(textInformation.petSellModule.get("sellMessage.title"))
		.setDescription(
			textInformation.petSellModule.format("sellMessage.description", {
				author: escapeUsername(textInformation.interaction.user.username),
				price: sellerInformation.petCost,
				guildMaxLevel: sellerInformation.guild.isAtMaxLevel()
			})
		)
		.addFields([{
			name: textInformation.petSellModule.get("petFieldName"),
			value: Translations.getModule("commands.profile", textInformation.petSellModule.language).format("pet.fieldValue", {
				rarity: (await Pets.getById(sellerInformation.pet.petId)).getRarityDisplay(),
				emote: sellerInformation.pet.getPetEmote(petModel),
				nickname: sellerInformation.pet.nickname ? sellerInformation.pet.nickname : sellerInformation.pet.getPetTypeName(petModel, textInformation.petSellModule.language)
			}),
			inline: false
		}])
		.setFooter({text: textInformation.petSellModule.get("sellMessage.footer")})
		.reply();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.petSell", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.petSell", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addIntegerOption(option => option.setName(currentCommandEnglishTranslations.get("optionPriceName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPriceName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionPriceDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPriceDescription")
			})
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};