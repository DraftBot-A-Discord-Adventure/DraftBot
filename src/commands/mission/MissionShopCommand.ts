import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import Entity, {Entities} from "../../core/models/Entity";
import {CommandInteraction} from "discord.js";
import {generateRandomItem, giveItemToPlayer} from "../../core/utils/ItemUtils";
import {DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {MissionsController} from "../../core/missions/MissionsController";
import {getDayNumber} from "../../core/utils/TimeUtils";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

/**
 * Displays the mission shop
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.missionShop", language);

	const resCategory = new ShopItemCategory(
		[
			getMoneyShopItem(shopTranslations),
			getValuableItemShopItem(shopTranslations),
			getAThousandPointsShopItem(shopTranslations, interaction)
		],
		shopTranslations.get("resTitle")
	);
	const utilCategory = new ShopItemCategory(
		[
			getSkipMapMissionShopItem(shopTranslations, interaction),
			getValueLovePointsPetShopItem(shopTranslations, interaction)
		],
		shopTranslations.get("utilTitle")
	);
	const presCategory = new ShopItemCategory(
		[
			getBadgeShopItem(shopTranslations, interaction)
		],
		shopTranslations.get("presTitle")
	);

	const shopMessage = await new DraftBotShopMessageBuilder(
		interaction,
		shopTranslations.get("title"),
		language
	)
		.addCategory(resCategory)
		.addCategory(utilCategory)
		.addCategory(presCategory)
		.endCallback(shopEndCallback)
		.setGetUserMoney(getUserGems)
		.setRemoveUserMoney(removeUserGems)
		.setTranslationPosition("commands.missionShop")
		.build();

	await shopMessage.reply(interaction, collector => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.MISSION_SHOP, collector));
}

/**
 * get the amount of gems a user has
 * @param userId
 */
const getUserGems = async (userId: string): Promise<number> => {
	const user = (await Entities.getOrRegister(userId))[0].Player;
	return user.PlayerMissionsInfo.gems;
};

/**
 * allow a user to pay
 * @param userId
 * @param amount
 */
async function removeUserGems(userId: string, amount: number): Promise<void> {
	const player = (await Entities.getByDiscordUserId(userId)).Player;
	player.PlayerMissionsInfo.addGems(-amount);
	await player.PlayerMissionsInfo.save();
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.MISSION_SHOP);
}

function getItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>): ShopItem {
	return new ShopItem(
		translationModule.get("items." + name + ".emote"),
		translationModule.get("items." + name + ".name"),
		parseInt(translationModule.get("items." + name + ".price")),
		translationModule.format("items." + name + ".info",
			{amount: calculateGemsToMoneyRatio()}
		),
		buyCallback
	);
}

function getSkipMapMissionShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"skipMapMission",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const allMissions = entity.Player.MissionSlots.filter(slot => !slot.isCampaign());
			if (!allMissions.length) {
				message.sentMessage.channel.send({
					embeds: [new DraftBotErrorEmbed(
						message.user,
						interaction,
						message.language,
						translationModule.get("error.noMissionToSkip")
					)]
				});
				return false;
			}
			const chooseMission = new DraftBotReactionMessageBuilder()
				.allowUser(message.user)
				.endCallback(async (missionMessage) => {
					const reaction = missionMessage.getFirstReaction();
					if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
						BlockingUtils.unblockPlayer(message.user.id, BlockingConstants.REASONS.MISSION_SHOP);
						await message.sentMessage.channel.send({
							embeds: [new DraftBotErrorEmbed(
								message.user,
								interaction,
								message.language,
								translationModule.get("error.canceledPurchase")
							)]
						});
						return false;
					}
					for (let i = 0; i < allMissions.length; ++i) {
						if (reaction.emoji.name === Constants.REACTIONS.NUMBERS[i + 1]) {
							entity.Player.PlayerMissionsInfo.addGems(-parseInt(translationModule.get("items.skipMapMission.price"), 10));
							await entity.Player.PlayerMissionsInfo.save();
							await message.sentMessage.channel.send({
								embeds: [
									new DraftBotEmbed()
										.formatAuthor(translationModule.get("items.skipMapMission.successTitle"), message.user)
										.setDescription(translationModule.format("items.skipMapMission.successDescription", {
											num: i + 1,
											missionInfo: await allMissions[i].Mission.formatDescription(
												allMissions[i].missionObjective,
												allMissions[i].missionVariant,
												message.language,
												allMissions[i].saveBlob
											)
										}))
								]
							});
							await allMissions[i].destroy();
							break;
						}
					}
					BlockingUtils.unblockPlayer(message.user.id, BlockingConstants.REASONS.MISSION_SHOP);
					await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
				});
			let desc = "";
			for (let i = 0; i < allMissions.length; ++i) {
				chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.NUMBERS[i + 1]));
				desc += Constants.REACTIONS.NUMBERS[i + 1] + " "
					+ await allMissions[i].Mission.formatDescription(allMissions[i].missionObjective, allMissions[i].missionVariant, message.language, allMissions[i].saveBlob) + "\n";
			}
			chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			const chooseMissionBuilt = chooseMission.build();
			chooseMissionBuilt.formatAuthor(translationModule.get("items.skipMapMission.giveTitle"), message.user);
			chooseMissionBuilt.setDescription(translationModule.get("items.skipMapMission.giveDesc") + "\n\n" + desc);
			await chooseMissionBuilt.send(message.sentMessage.channel);
			BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.MISSION_SHOP, chooseMissionBuilt.collector);
			return false;
		});
}

/**
 * Calculate the amount of money the player will have if he buys some with gems
 */
function calculateGemsToMoneyRatio() {
	const frac = function(x: number) {
		return x >= 0 ? x % 1 : 1 + x % 1;
	};
	return Constants.MISSION_SHOP.BASE_RATIO +
		Math.round(Constants.MISSION_SHOP.RANGE_MISSION_MONEY * 2 *
			frac(100 * Math.sin(100000 * (getDayNumber() % Constants.MISSION_SHOP.SEED_RANGE) + 1)) -
			Constants.MISSION_SHOP.RANGE_MISSION_MONEY);
}

function getMoneyShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"money",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.Player.addMoney(entity, calculateGemsToMoneyRatio(), message.sentMessage.channel, translationModule.language);
			await entity.Player.save();
			await message.sentMessage.channel.send(
				{
					embeds: [new DraftBotEmbed()
						.formatAuthor(translationModule.get("items.money.giveTitle"), message.user)
						.setDescription(translationModule.format("items.money.giveDescription", {amount: calculateGemsToMoneyRatio()})
						)]
				});
			await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getValuableItemShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"valuableItem",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const item = await generateRandomItem(Constants.RARITY.MYTHICAL, null, Constants.RARITY.SPECIAL);
			await giveItemToPlayer(entity, item, message.language, message.user, message.sentMessage.channel);
			await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getAThousandPointsShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"1000Points",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.PlayerMissionsInfo.hasBoughtPointsThisWeek) {
				message.sentMessage.channel.send({
					embeds: [new DraftBotErrorEmbed(
						message.user,
						interaction,
						message.language,
						translationModule.get("error.remainingCooldown")
					)]
				});
				return false;
			}
			await entity.Player.addScore(entity, 1000, message.sentMessage.channel, translationModule.language);
			await entity.Player.save();
			await message.sentMessage.channel.send(
				{
					embeds: [new DraftBotEmbed()
						.formatAuthor(translationModule.get("items.1000Points.giveTitle"), message.user)
						.setDescription(translationModule.get("items.1000Points.giveDescription")
						)]
				});
			entity.Player.PlayerMissionsInfo.hasBoughtPointsThisWeek = true;
			await entity.Player.PlayerMissionsInfo.save();
			await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getValueLovePointsPetShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"lovePointsValue",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.petId === null) {
				message.sentMessage.channel.send({
					embeds: [new DraftBotErrorEmbed(
						message.user,
						interaction,
						message.language,
						translationModule.get("error.noPet")
					)]
				});
				return false;
			}
			const sentenceGotten = translationModule.getRandom("items.lovePointsValue.advice." + entity.Player.Pet.getLoveLevelNumber());
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("items.lovePointsValue.giveTitle"), message.user)
					.setDescription(translationModule.format("items.lovePointsValue.giveDesc", {
						petName: entity.Player.Pet.displayName(message.language),
						actualLP: entity.Player.Pet.lovePoints,
						regime: entity.Player.Pet.getDietDisplay(message.language),
						nextFeed: entity.Player.Pet.getFeedCooldownDisplay(message.language),
						commentOnResult: sentenceGotten
					}))
				]
			});
			await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getBadgeShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge(Constants.BADGES.QUEST_MASTER)) {
				sendErrorMessage(
					message.user,
					interaction,
					message.language,
					translationModule.get("error.alreadyHasItem")
				);
				return false;
			}
			entity.Player.addBadge(Constants.BADGES.QUEST_MASTER);
			await entity.Player.save();
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("items.badge.give"), message.user)
					.setDescription(Constants.BADGES.QUEST_MASTER + " " + translationModule.get("items.badge.name"))
				]
			});
			await MissionsController.update(message.user.id, message.sentMessage.channel, message.language, "spendGems");
			return true;
		}
	);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("missionshop")
		.setDescription("Shows the mission's shop in order to buy mission related items"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED]
	},
	mainGuildCommand: false
};