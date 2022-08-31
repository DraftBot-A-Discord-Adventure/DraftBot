import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity, {Entities} from "../../core/database/game/models/Entity";
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
import PetEntity from "../../core/database/game/models/PetEntity";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {
	BroadcastTranslationModuleLike,
	DraftBotBroadcastValidationMessage
} from "../../core/messages/DraftBotBroadcastValidationMessage";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";

type TextInformations = { interaction: CommandInteraction, petSellModule: TranslationModule };
type SellerInformations = { entity: Entity, pet: PetEntity, guild: Guild, petCost: number };
type BuyerInformations = { buyer: Entity, user: User };

/**
 * Check if the requirements for selling the pet are fulfilled
 * @param textInformations
 * @param sellerInformations
 */
async function missingRequirementsToSellPet(textInformations: TextInformations, sellerInformations: SellerInformations): Promise<boolean> {
	if (!sellerInformations.pet) {
		await replyErrorMessage(
			textInformations.interaction,
			textInformations.petSellModule.language,
			Translations.getModule("commands.pet", textInformations.petSellModule.language).get("noPet")
		);
		return true;
	}

	if (sellerInformations.pet.isFeisty()) {
		await replyErrorMessage(
			textInformations.interaction,
			textInformations.petSellModule.language,
			textInformations.petSellModule.get("isFeisty")
		);
		return true;
	}

	if (sellerInformations.petCost < PetSellConstants.SELL_PRICE_MIN || sellerInformations.petCost > PetSellConstants.SELL_PRICE_MAX) {
		await replyErrorMessage(
			textInformations.interaction,
			textInformations.petSellModule.language,
			textInformations.petSellModule.format("badPrice", {
				minPrice: PetSellConstants.SELL_PRICE_MIN,
				maxPrice: PetSellConstants.SELL_PRICE_MAX
			})
		);
		return true;
	}

	if (sellerInformations.guild.isAtMaxLevel()) {
		await replyErrorMessage(
			textInformations.interaction,
			textInformations.petSellModule.language,
			textInformations.petSellModule.get("guildAtMaxLevel")
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
 * @param buyerInformations
 * @param sellerInformations
 * @param textInformations
 */
async function executeTheTransaction(
	buyerInformations: BuyerInformations,
	sellerInformations: SellerInformations,
	textInformations: TextInformations
): Promise<void> {
	const buyerGuild = await Guilds.getById(buyerInformations.buyer.Player.guildId);
	if (buyerGuild && buyerGuild.id === sellerInformations.guild.id) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction, textInformations.petSellModule.language, textInformations.petSellModule.get("sameGuild"));
		return;
	}
	if (buyerInformations.buyer.Player.Pet) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction, textInformations.petSellModule.language, textInformations.petSellModule.get("havePet"));
		return;
	}
	if (sellerInformations.petCost > buyerInformations.buyer.Player.money) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction, textInformations.petSellModule.language, textInformations.petSellModule.get("noMoney"));
		return;
	}
	const xpToAdd = calculateAmountOfXPToAdd(sellerInformations.petCost);
	await sellerInformations.guild.addExperience(xpToAdd, textInformations.interaction.channel, textInformations.petSellModule.language, NumberChangeReason.PET_SELL);
	buyerInformations.buyer.Player.petId = sellerInformations.pet.id;
	sellerInformations.entity.Player.petId = null;
	sellerInformations.pet.lovePoints = Constants.PETS.BASE_LOVE;
	// the money has to be edited before the player is saved to avoid cross writing to the database
	await buyerInformations.buyer.Player.addMoney(
		buyerInformations.buyer,
		-sellerInformations.petCost,
		textInformations.interaction.channel,
		textInformations.petSellModule.language,
		NumberChangeReason.PET_SELL
	);
	await Promise.all([
		sellerInformations.guild.save(),
		buyerInformations.buyer.Player.save(),
		sellerInformations.entity.Player.save(),
		sellerInformations.pet.save()
	]);
	if (!sellerInformations.guild.isAtMaxLevel()) {
		const guildXpEmbed = new DraftBotEmbed();
		const gdModule = Translations.getModule("commands.guildDaily", textInformations.petSellModule.language);
		guildXpEmbed.setTitle(
			gdModule.format("rewardTitle", {
				guildName: sellerInformations.guild.name
			})
		);
		guildXpEmbed.setDescription(
			gdModule.format("guildXP", {
				xp: xpToAdd
			})
		);
		textInformations.interaction.followUp({embeds: [guildXpEmbed]}).then();
	}
	const addPetEmbed = new DraftBotEmbed()
		.formatAuthor(textInformations.petSellModule.get("addPetEmbed.author"), buyerInformations.user)
		.setDescription(
			textInformations.petSellModule.format("addPetEmbed.description", {
				emote: sellerInformations.pet.getPetEmote(),
				pet: sellerInformations.pet.nickname ? sellerInformations.pet.nickname : sellerInformations.pet.getPetTypeName(textInformations.petSellModule.language)
			})
		);
	await textInformations.interaction.followUp({embeds: [addPetEmbed]});
	draftBotInstance.logsDatabase.logsPetSell(sellerInformations.pet, sellerInformations.entity.discordUserId, buyerInformations.user.id, sellerInformations.petCost).then();
	await MissionsController.update(buyerInformations.buyer, textInformations.interaction.channel, textInformations.petSellModule.language, {missionId: "havePet"});
	await MissionsController.update(sellerInformations.entity, textInformations.interaction.channel, textInformations.petSellModule.language, {missionId: "sellOrTradePet"});
}

/**
 * Manage the confirmation of the potential buyer
 * @param textInformations
 * @param sellerInformations
 * @param buyerInformations
 */
async function petSell(
	textInformations: TextInformations,
	sellerInformations: SellerInformations,
	buyerInformations: BuyerInformations
): Promise<void> {
	BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId, BlockingConstants.REASONS.PET_SELL);
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(textInformations.petSellModule.get("confirmEmbed.author"), buyerInformations.user)
		.setDescription(
			textInformations.petSellModule.format("confirmEmbed.description", {
				emote: sellerInformations.pet.getPetEmote(),
				pet: sellerInformations.pet.nickname ? sellerInformations.pet.nickname : sellerInformations.pet.getPetTypeName(textInformations.petSellModule.language),
				price: sellerInformations.petCost
			})
		);

	const confirmMessage = await textInformations.interaction.followUp({
		embeds: [confirmEmbed],
		fetchReply: true
	}) as Message;

	const confirmCollector = confirmMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => user.id === buyerInformations.buyer.discordUserId &&
			reaction.me &&
			(reaction.emoji.name === Constants.MENU_REACTION.ACCEPT ||
				reaction.emoji.name === Constants.MENU_REACTION.DENY),
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(buyerInformations.buyer.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM, confirmCollector);
	BlockingUtils.blockPlayerWithCollector(sellerInformations.entity.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM, confirmCollector);
	confirmCollector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			confirmCollector.stop();
			await sendErrorMessage(buyerInformations.user, textInformations.interaction, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
			return;
		}
		if (reaction.emoji.name === Constants.MENU_REACTION.ACCEPT) {
			confirmCollector.stop();
			await executeTheTransaction(buyerInformations, sellerInformations, textInformations);
		}
	});
	confirmCollector.on("end", async (reaction) => {
		if (!reaction.first()) {
			await sendErrorMessage(buyerInformations.user, textInformations.interaction, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
		}
		BlockingUtils.unblockPlayer(buyerInformations.buyer.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM);
		BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId, BlockingConstants.REASONS.PET_SELL_CONFIRM);
	});
	await Promise.all([confirmMessage.react(Constants.MENU_REACTION.ACCEPT), confirmMessage.react(Constants.MENU_REACTION.DENY)]);
}

/**
 * executed when a potential buyer react to the message
 * @param sellerInformations
 * @param textInformations
 */
function getAcceptCallback(sellerInformations: SellerInformations, textInformations: TextInformations): (user: User) => Promise<boolean> {
	return async (user: User): Promise<boolean> => {
		const buyerInformations = {user, buyer: await Entities.getByDiscordUserId(user.id)};
		if (buyerInformations.buyer.Player.effect === EffectsConstants.EMOJI_TEXT.BABY ||
			await sendBlockedError(textInformations.interaction, textInformations.petSellModule.language, buyerInformations.user)) {
			buyerInformations.buyer = null;
			return false;
		}
		await petSell(textInformations, sellerInformations, buyerInformations);
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
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petSellModule = Translations.getModule("commands.petSell", language);

	const petCost = interaction.options.getInteger("price");
	const pet = entity.Player.Pet;
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
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

	const textInformations = {interaction, petSellModule};
	const sellerInformations = {entity, pet, guild, petCost};

	if (await missingRequirementsToSellPet(textInformations, sellerInformations)) {
		return;
	}

	await new DraftBotBroadcastValidationMessage(
		interaction,
		language,
		getAcceptCallback(sellerInformations, textInformations),
		BlockingConstants.REASONS.PET_SELL,
		getBroadcastErrorStrings(petSellModule))
		.setTitle(textInformations.petSellModule.get("sellMessage.title"))
		.setDescription(
			textInformations.petSellModule.format("sellMessage.description", {
				author: escapeUsername(textInformations.interaction.user.username),
				price: sellerInformations.petCost,
				guildMaxLevel: sellerInformations.guild.isAtMaxLevel()
			})
		)
		.addFields([{
			name: textInformations.petSellModule.get("petFieldName"),
			value: Translations.getModule("commands.profile", textInformations.petSellModule.language).format("pet.fieldValue", {
				rarity: sellerInformations.pet.PetModel.getRarityDisplay(),
				emote: sellerInformations.pet.getPetEmote(),
				nickname: sellerInformations.pet.nickname ? sellerInformations.pet.nickname : sellerInformations.pet.getPetTypeName(textInformations.petSellModule.language)
			}),
			inline: false
		}])
		.setFooter({text: textInformations.petSellModule.get("sellMessage.footer")})
		.reply();
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("petsell")
		.setDescription("Sell your pet at a given price")
		.addIntegerOption(option => option.setName("price")
			.setDescription("The price at which you want to sell your pet")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};