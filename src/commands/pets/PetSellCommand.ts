import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity, {Entities} from "../../core/models/Entity";
import {Guild, Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {escapeUsername} from "../../core/utils/StringUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageReaction, ReactionCollector, User} from "discord.js";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {PetSellConstants} from "../../core/constants/PetSellConstants";
import PetEntity from "../../core/models/PetEntity";
import {RandomUtils} from "../../core/utils/RandomUtils";

type TextInformations = { interaction: CommandInteraction, petSellModule: TranslationModule };
type SellerInformations = { entity: Entity, pet: PetEntity, guild: Guild, petCost: number };
type BuyerInformations = { buyer: Entity, user: User };
type CollectorManagement = { spamCount: number, gotAnAnswer: boolean, spammers: string[], collector: ReactionCollector, reaction: MessageReaction }

/**
 * Check if the requirements for selling the pet are fullfiled
 * @param textInformations
 * @param sellerInformations
 */
async function missingRequirementsToSellPet(textInformations: TextInformations, sellerInformations: SellerInformations) {
	if (!sellerInformations.pet) {
		await sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.petSellModule.language,
			Translations.getModule("commands.pet", textInformations.petSellModule.language).get("noPet"),
			false,
			textInformations.interaction
		);
		return true;
	}

	if (sellerInformations.pet.isFeisty()) {
		await sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.petSellModule.language,
			textInformations.petSellModule.get("isFeisty"),
			false,
			textInformations.interaction
		);
		return true;
	}

	if (sellerInformations.petCost < PetSellConstants.SELL_PRICE_MIN || sellerInformations.petCost > PetSellConstants.SELL_PRICE_MAX) {
		await sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.petSellModule.language,
			textInformations.petSellModule.format("badPrice", {
				minPrice: PetSellConstants.SELL_PRICE_MIN,
				maxPrice: PetSellConstants.SELL_PRICE_MAX
			}),
			false,
			textInformations.interaction
		);
		return true;
	}

	if (sellerInformations.guild.isAtMaxLevel()) {
		await sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.petSellModule.language,
			textInformations.petSellModule.get("guildAtMaxLevel"),
			false,
			textInformations.interaction
		);
		return true;
	}

	return false;
}

/**
 * Send a broadcast sell request and returns the message
 * @param textInformations
 * @param sellerInformations
 */
async function broadcastSellRequest(textInformations: TextInformations, sellerInformations: SellerInformations) {
	return await textInformations.interaction.reply({
		embeds: [
			new DraftBotEmbed()
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
				.setFooter(textInformations.petSellModule.get("sellMessage.footer"))
		],
		fetchReply: true
	}) as Message;
}

/**
 * Does the action of selling the pet from the seller to the buyer
 * @param buyerInformations
 * @param sellerInformations
 * @param textInformations
 */
async function executeTheTransaction(buyerInformations: BuyerInformations, sellerInformations: SellerInformations, textInformations: TextInformations) {
	let buyerGuild;
	try {
		buyerGuild = await Guilds.getById(buyerInformations.buyer.Player.guildId);
	}
	catch (error) {
		buyerGuild = null;
	}
	if (buyerGuild && buyerGuild.id === sellerInformations.guild.id) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sameGuild"));
		return;
	}
	const buyerPet = buyerInformations.buyer.Player.Pet;
	if (buyerPet) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("havePet"));
		return;
	}
	if (sellerInformations.petCost > buyerInformations.buyer.Player.money) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("noMoney"));
		return;
	}
	const MIN_XP = Math.floor(sellerInformations.petCost / PetSellConstants.MIN_XP_DIVIDER);
	const MAX_XP = Math.floor(sellerInformations.petCost / PetSellConstants.MAX_XP_DIVIDER);
	const toAdd = Math.floor(RandomUtils.randInt(MIN_XP, MAX_XP + 1));
	await sellerInformations.guild.addExperience(toAdd, textInformations.interaction.channel, textInformations.petSellModule.language);

	await sellerInformations.guild.save();
	buyerInformations.buyer.Player.petId = sellerInformations.pet.id;
	await buyerInformations.buyer.Player.addMoney(buyerInformations.buyer, -sellerInformations.petCost, textInformations.interaction.channel, textInformations.petSellModule.language);
	await buyerInformations.buyer.Player.save();
	sellerInformations.entity.Player.petId = null;
	await sellerInformations.entity.Player.save();
	sellerInformations.pet.lovePoints = Constants.PETS.BASE_LOVE;
	await sellerInformations.pet.save();
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
				xp: toAdd
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
	await MissionsController.update(buyerInformations.buyer.discordUserId, textInformations.interaction.channel, textInformations.petSellModule.language, "havePet");
	await MissionsController.update(sellerInformations.entity.discordUserId, textInformations.interaction.channel, textInformations.petSellModule.language, "sellOrTradePet");
}

/**
 * Manage the confirmation of the potential buyer
 * @param textInformations
 * @param sellerInformations
 * @param buyerInformations
 */
async function petSell(textInformations: TextInformations, sellerInformations: SellerInformations, buyerInformations: BuyerInformations) {
	BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
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

	BlockingUtils.blockPlayerWithCollector(buyerInformations.buyer.discordUserId, "petSellConfirm", confirmCollector);
	BlockingUtils.blockPlayerWithCollector(sellerInformations.entity.discordUserId, "petSellConfirm", confirmCollector);
	confirmCollector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			confirmCollector.stop();
			await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
			return;
		}
		if (reaction.emoji.name === Constants.MENU_REACTION.ACCEPT) {
			confirmCollector.stop();
			await executeTheTransaction(buyerInformations, sellerInformations, textInformations);
		}
	});
	confirmCollector.on("end", async (reaction) => {
		if (!reaction.first()) {
			await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
		}
		BlockingUtils.unblockPlayer(buyerInformations.buyer.discordUserId);
		BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
	});
	await Promise.all([confirmMessage.react(Constants.MENU_REACTION.ACCEPT), confirmMessage.react(Constants.MENU_REACTION.DENY)]);
}

/**
 * Manage the acceptation of the broadcast request
 * @param buyerInformations
 * @param sellerInformations
 * @param textInformations
 * @param collectorManagement
 */
async function manageAcceptReaction(buyerInformations: BuyerInformations, sellerInformations: SellerInformations, textInformations: TextInformations, collectorManagement: CollectorManagement) {
	if (buyerInformations.user.id === sellerInformations.entity.discordUserId) {
		collectorManagement.spamCount++;
		if (collectorManagement.spamCount < PetSellConstants.MAX_SPAM_COUNT_SELLER) {
			await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.canSellYourself"));
			return false;
		}
		await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.spam"));
		BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
		return true;
	}
	buyerInformations.buyer = await Entities.getByDiscordUserId(buyerInformations.user.id);
	if (buyerInformations.buyer.Player.effect === Constants.EFFECT.BABY ||
		await sendBlockedError(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language)) {
		buyerInformations.buyer = null;
		return false;
	}
	await petSell(textInformations, sellerInformations, buyerInformations);
	return true;
}

/**
 * Manage the denial reaction of the broadcast request
 * @param buyerInformations
 * @param sellerInformations
 * @param textInformations
 * @param collectorManagement
 */
async function manageDenyReaction(buyerInformations: BuyerInformations, sellerInformations: SellerInformations, textInformations: TextInformations, collectorManagement: CollectorManagement) {
	if (buyerInformations.user.id === sellerInformations.entity.discordUserId) {
		await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
		BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
		return true;
	}
	if (collectorManagement.spammers.includes(buyerInformations.user.id)) {
		return false;
	}
	collectorManagement.spammers.push(buyerInformations.user.id);
	await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.onlyInitiator"));
	return false;
}

/**
 * Check the collected reaction from the broadcast request
 * @param buyerInformations
 * @param sellerInformations
 * @param textInformations
 * @param collectorManagement
 */
async function checkReactionBroadcastCollector(
	buyerInformations: BuyerInformations,
	sellerInformations: SellerInformations,
	textInformations: TextInformations,
	collectorManagement: CollectorManagement) {
	switch (collectorManagement.reaction.emoji.name) {
	case Constants.MENU_REACTION.ACCEPT:
		if (!await manageAcceptReaction(buyerInformations, sellerInformations, textInformations, collectorManagement)) {
			return;
		}
		collectorManagement.gotAnAnswer = true;
		break;
	case Constants.MENU_REACTION.DENY:
		if (!await manageDenyReaction(buyerInformations, sellerInformations, textInformations, collectorManagement)) {
			return;
		}
		collectorManagement.gotAnAnswer = true;
		break;
	default:
		return;
	}
	collectorManagement.collector.stop();
}

/**
 * Manage the answers to the broadcasted request
 * @param collector
 * @param sellerInformations
 * @param textInformations
 */
function manageCollectedAnswers(collector: ReactionCollector, sellerInformations: SellerInformations, textInformations: TextInformations) {
	const collectorManagement: CollectorManagement = {
		spamCount: 0,
		spammers: [],
		gotAnAnswer: false,
		collector: collector,
		reaction: null
	};
	const buyer: Entity = null;
	collector.on("collect", async (reaction: MessageReaction, user: User) => {
		const buyerInformations: BuyerInformations = {user, buyer};
		collectorManagement.reaction = reaction;
		await checkReactionBroadcastCollector(buyerInformations, sellerInformations, textInformations, collectorManagement);
	});

	collector.on("end", async function() {
		if (!collectorManagement.gotAnAnswer && buyer === null) {
			BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
			await sendErrorMessage(
				textInformations.interaction.user,
				textInformations.interaction.channel,
				textInformations.petSellModule.language,
				textInformations.petSellModule.get("errors.noOneAvailable")
			);
		}
	});
}

/**
 * Broadcast a sell request of the player's pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
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
		await sendErrorMessage(
			interaction.user,
			interaction.channel,
			petSellModule.language,
			Translations.getModule("commands.guildAdd", petSellModule.language).get("notInAguild"),
			false,
			interaction
		);
		return;
	}

	const textInformations = {interaction, petSellModule};
	const sellerInformations = {entity, pet, guild, petCost};

	if (await missingRequirementsToSellPet(textInformations, sellerInformations)) {
		return;
	}

	const sellMessage = await broadcastSellRequest(textInformations, sellerInformations);

	const collector = sellMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => !user.bot,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "petSell", collector);
	manageCollectedAnswers(collector, sellerInformations, textInformations);
	await Promise.all([sellMessage.react(Constants.MENU_REACTION.ACCEPT), sellMessage.react(Constants.MENU_REACTION.DENY)]);
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
		allowEffects: [Constants.EFFECT.SMILEY]
	},
	mainGuildCommand: false
};