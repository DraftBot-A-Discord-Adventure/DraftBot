import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity, {Entities} from "../../core/models/Entity";
import {Guild, Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {escapeUsername} from "../../core/utils/StringUtils";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {PetSellConstants} from "../../core/constants/PetSellConstants";
import PetEntity from "../../core/models/PetEntity";
import {RandomUtils} from "../../core/utils/RandomUtils";

type TextInformations = { interaction: CommandInteraction, petSellModule: TranslationModule };
type SellerInformations = { entity: Entity, pet: PetEntity };
type BuyerInformations = { buyer: Entity, user: User };

async function missingRequirementsToSellPet(textInformations: TextInformations, pet: PetEntity, petCost: number) {
	if (!pet) {
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

	if (pet.isFeisty()) {
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

	if (petCost < PetSellConstants.SELL_PRICE_MIN || petCost > PetSellConstants.SELL_PRICE_MAX) {
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
	return false;
}

async function broadcastSellRequest(textInformations: TextInformations, petCost: number, guild: Guild, pet: PetEntity) {
	return await textInformations.interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(textInformations.petSellModule.get("sellMessage.title"))
				.setDescription(
					textInformations.petSellModule.format("sellMessage.description", {
						author: escapeUsername(textInformations.interaction.user.username),
						price: petCost,
						guildMaxLevel: guild.isAtMaxLevel()
					})
				)
				.addFields([{
					name: textInformations.petSellModule.get("petFieldName"),
					value: Translations.getModule("commands.profile", textInformations.petSellModule.language).format("pet.fieldValue", {
						rarity: pet.PetModel.getRarityDisplay(),
						emote: pet.getPetEmote(),
						nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(textInformations.petSellModule.language)
					}),
					inline: false
				}])
				.setFooter(textInformations.petSellModule.get("sellMessage.footer"))
		],
		fetchReply: true
	}) as Message;
}

function manageCollectedAnswers(collector: any, sellerInformations: SellerInformations, textInformations: TextInformations, petCost: number) {
	let spamCount = 0;
	const spammers: string[] = [];
	let buyer: Entity = null;
	// TODO : A QUOI TU SERS SELLINSTANCE
	let sellInstance: any;
	collector.on("collect", async (reaction: MessageReaction, user: User) => {
		switch (reaction.emoji.name) {
		case Constants.MENU_REACTION.ACCEPT:
			if (user.id === sellerInformations.entity.discordUserId) {
				spamCount++;
				if (spamCount < 3) {
					await sendErrorMessage(user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.canSellYourself"));
					return;
				}
				await sendErrorMessage(user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.spam"));
				sellInstance = null;
				break;
			}
			buyer = await Entities.getByDiscordUserId(user.id);
			if (buyer.Player.effect === Constants.EFFECT.BABY) {
				buyer = null;
				return;
			}
			await petSell(textInformations, sellerInformations, {user, buyer}, petCost);
			break;
		case Constants.MENU_REACTION.DENY:
			if (user.id === sellerInformations.entity.discordUserId) {
				await sendErrorMessage(user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
			}
			else {
				if (spammers.includes(user.id)) {
					return;
				}
				spammers.push(user.id);
				await sendErrorMessage(user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("errors.onlyInitiator"));
				return;
			}
			sellInstance = null;
			break;
		default:
			return;
		}
		collector.stop();
	});

	collector.on("end", async function() {
		if (sellInstance === undefined) {
			BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
			if (buyer === null) {
				await sendErrorMessage(
					textInformations.interaction.user,
					textInformations.interaction.channel,
					textInformations.petSellModule.language,
					textInformations.petSellModule.get("errors.noOneAvailable")
				);
			}
		}
		if (sellInstance === null) {
			BlockingUtils.unblockPlayer(sellerInformations.entity.discordUserId);
		}
	});
}

async function petSell(textInformations: TextInformations, sellerInformations: SellerInformations, buyerInformations: BuyerInformations, petCost: number) {
	const guild = await Guilds.getById(sellerInformations.entity.Player.guildId);
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(textInformations.petSellModule.get("confirmEmbed.author"), buyerInformations.user)
		.setDescription(
			textInformations.petSellModule.format("confirmEmbed.description", {
				emote: sellerInformations.pet.getPetEmote(),
				pet: sellerInformations.pet.nickname ? sellerInformations.pet.nickname : sellerInformations.pet.getPetTypeName(textInformations.petSellModule.language),
				price: petCost
			})
		);

	const confirmMessage = await textInformations.interaction.followUp({
		embeds: [confirmEmbed],
		fetchReply: true
	}) as Message;

	const confirmFilter = (reaction: MessageReaction, user: User) => user.id === buyerInformations.buyer.discordUserId &&
		reaction.me &&
		(reaction.emoji.name === Constants.MENU_REACTION.ACCEPT ||
			reaction.emoji.name === Constants.MENU_REACTION.DENY);

	const confirmCollector = confirmMessage.createReactionCollector({
		filter: confirmFilter,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(buyerInformations.buyer.discordUserId, "petSellConfirm", confirmCollector);
	confirmCollector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			confirmCollector.stop();
			await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sellCancelled"), true);
			return;
		}
		if (reaction.emoji.name === Constants.MENU_REACTION.ACCEPT) {
			confirmCollector.stop();
			let buyerGuild;
			try {
				buyerGuild = await Guilds.getById(buyerInformations.buyer.Player.guildId);
			}
			catch (error) {
				buyerGuild = null;
			}
			if (buyerGuild && buyerGuild.id === guild.id) {
				await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("sameGuild"));
				return;
			}
			const buyerPet = buyerInformations.buyer.Player.Pet;
			if (buyerPet) {
				await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("havePet"));
				return;
			}
			if (petCost > buyerInformations.buyer.Player.money) {
				await sendErrorMessage(buyerInformations.user, textInformations.interaction.channel, textInformations.petSellModule.language, textInformations.petSellModule.get("noMoney"));
				return;
			}
			const MIN_XP = Math.floor(petCost / (1000 / 50));
			const MAX_XP = Math.floor(petCost / (1000 / 450));
			const toAdd = Math.floor(RandomUtils.randInt(MIN_XP, MAX_XP + 1));
			await guild.addExperience(toAdd, textInformations.interaction.channel, textInformations.petSellModule.language);

			await guild.save();
			buyerInformations.buyer.Player.petId = sellerInformations.pet.id;
			await buyerInformations.buyer.Player.addMoney(buyerInformations.buyer, -petCost, textInformations.interaction.channel, textInformations.petSellModule.language);
			await buyerInformations.buyer.Player.save();
			sellerInformations.entity.Player.petId = null;
			await sellerInformations.entity.Player.save();
			sellerInformations.pet.lovePoints = Constants.PETS.BASE_LOVE;
			await sellerInformations.pet.save();
			if (!guild.isAtMaxLevel()) {
				const guildXpEmbed = new DraftBotEmbed();
				const gdModule = Translations.getModule("commands.guildDaily", textInformations.petSellModule.language);
				guildXpEmbed.setTitle(
					gdModule.format("rewardTitle", {
						guildName: guild.name
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
	});
	confirmCollector.on("end", () => BlockingUtils.unblockPlayer(buyerInformations.buyer.discordUserId));
	await Promise.all([confirmMessage.react(Constants.MENU_REACTION.ACCEPT), confirmMessage.react(Constants.MENU_REACTION.DENY)]);
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

	if (await missingRequirementsToSellPet(textInformations, pet, petCost)) {
		return;
	}

	const sellMessage = await broadcastSellRequest(textInformations, petCost, guild, pet);

	const filter = (reaction: MessageReaction, user: User) => !user.bot;
	const collector = sellMessage.createReactionCollector({
		filter,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "petSell", collector);
	manageCollectedAnswers(collector, {entity, pet}, textInformations, petCost);
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