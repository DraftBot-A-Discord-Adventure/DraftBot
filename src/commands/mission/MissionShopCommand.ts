import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import Entity, {Entities} from "../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {generateRandomItem, giveItemToPlayer} from "../../core/utils/ItemUtils";
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {MissionsController} from "../../core/missions/MissionsController";
import {getDayNumber} from "../../core/utils/TimeUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason, ShopItemType} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

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
	const entity = await Entities.getByDiscordUserId(userId);
	await entity.Player.PlayerMissionsInfo.addGems(-amount, entity, NumberChangeReason.MISSION_SHOP);
}

/**
 * Callback of the mission shop command
 * @param shopMessage
 */
function shopEndCallback(shopMessage: DraftBotShopMessage): void {
	BlockingUtils.unblockPlayer(shopMessage.user.id, BlockingConstants.REASONS.MISSION_SHOP);
}

/**
 * Calculate the amount of money the player will have if he buys some with gems
 */
function calculateGemsToMoneyRatio(): number {
	/**
	 * Returns the decimal part of a number
	 * @param x
	 */
	const frac = function(x: number): number {
		return x >= 0 ? x % 1 : 1 + x % 1;
	};
	return Constants.MISSION_SHOP.BASE_RATIO +
		Math.round(Constants.MISSION_SHOP.RANGE_MISSION_MONEY * 2 *
			frac(100 * Math.sin(100000 * (getDayNumber() % Constants.MISSION_SHOP.SEED_RANGE) + 1)) -
			Constants.MISSION_SHOP.RANGE_MISSION_MONEY);
}

/**
 * Creates a shop item for the mission shop
 * @param name
 * @param translationModule
 * @param buyCallback
 */
function getItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>): ShopItem {
	return new ShopItem(
		translationModule.get(`items.${name}.emote`),
		translationModule.get(`items.${name}.name`),
		parseInt(translationModule.get(`items.${name}.price`), 10),
		translationModule.format(`items.${name}.info`,
			{amount: calculateGemsToMoneyRatio()}
		),
		buyCallback
	);
}

/**
 * Get the end callback of the skip mission shop item
 * @param message
 * @param interaction
 * @param translationModule
 * @param entity
 */
function getEndCallbackSkipMissionShopItem(
	message: DraftBotShopMessage,
	interaction: CommandInteraction,
	translationModule: TranslationModule,
	entity: Entity
): (missionMessage: DraftBotShopMessage) => Promise<boolean> {
	const allMissions = entity.Player.MissionSlots.filter(slot => !slot.isCampaign());
	return async (missionMessage: DraftBotShopMessage): Promise<boolean> => {
		const reaction = missionMessage.getFirstReaction();
		if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
			BlockingUtils.unblockPlayer(message.user.id, BlockingConstants.REASONS.MISSION_SHOP);
			await sendErrorMessage(
				message.user,
				interaction,
				message.language,
				translationModule.get("error.canceledPurchase")
			);
			return false;
		}
		for (let i = 0; i < allMissions.length; ++i) {
			if (reaction.emoji.name === Constants.REACTIONS.NUMBERS[i + 1]) {
				await removeUserGems(entity.discordUserId, parseInt(translationModule.get("items.skipMapMission.price"), 10));
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
		await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
		draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.MISSION_SKIP).then();
	};
}

/**
 * Get the shop item for skipping a mission
 * @param translationModule
 * @param interaction
 */
function getSkipMapMissionShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"skipMapMission",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const allMissions = entity.Player.MissionSlots.filter(slot => !slot.isCampaign());
			if (!allMissions.length) {
				await sendErrorMessage(
					message.user,
					interaction,
					message.language,
					translationModule.get("error.noMissionToSkip")
				);
				return false;
			}
			const chooseMission = new DraftBotReactionMessageBuilder()
				.allowUser(message.user)
				.endCallback(getEndCallbackSkipMissionShopItem(message, interaction, translationModule, entity) as (msg: DraftBotReactionMessage) => void);
			let desc = "";
			for (let i = 0; i < allMissions.length; ++i) {
				chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.NUMBERS[i + 1]));
				desc += `${Constants.REACTIONS.NUMBERS[i + 1]} ${await allMissions[i].Mission.formatDescription(
					allMissions[i].missionObjective,
					allMissions[i].missionVariant,
					message.language,
					allMissions[i].saveBlob)}\n`;
			}
			chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			const chooseMissionBuilt = chooseMission.build();
			chooseMissionBuilt.formatAuthor(translationModule.get("items.skipMapMission.giveTitle"), message.user);
			chooseMissionBuilt.setDescription(`${translationModule.get("items.skipMapMission.giveDesc")}\n\n${desc}`);
			await chooseMissionBuilt.send(message.sentMessage.channel);
			BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.MISSION_SHOP, chooseMissionBuilt.collector);
			return false;
		});
}

/**
 * Get the shop item for buying money for gems
 * @param translationModule
 */
function getMoneyShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"money",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			await entity.Player.addMoney({
				entity,
				amount: calculateGemsToMoneyRatio(),
				channel: message.sentMessage.channel,
				language: translationModule.language,
				reason: NumberChangeReason.MISSION_SHOP
			});
			await entity.Player.save();
			await message.sentMessage.channel.send(
				{
					embeds: [new DraftBotEmbed()
						.formatAuthor(translationModule.get("items.money.giveTitle"), message.user)
						.setDescription(translationModule.format("items.money.giveDescription", {amount: calculateGemsToMoneyRatio()})
						)]
				});
			await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
			draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.MONEY).then();
			return true;
		});
}

/**
 * Get the shop item for buying a royal treasure
 * @param translationModule
 */
function getValuableItemShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"valuableItem",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const item = await generateRandomItem(Constants.RARITY.MYTHICAL, null, Constants.RARITY.SPECIAL);
			await giveItemToPlayer(entity, item, message.language, message.user, message.sentMessage.channel);
			await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
			draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.TREASURE).then();
			return true;
		});
}

/**
 * Get the shop item for getting the fervor of the court
 * @param translationModule
 * @param interaction
 */
function getAThousandPointsShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"1000Points",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.PlayerMissionsInfo.hasBoughtPointsThisWeek) {
				await sendErrorMessage(
					message.user,
					interaction,
					message.language,
					translationModule.get("error.remainingCooldown")
				);
				return false;
			}
			await entity.Player.addScore({
				entity,
				amount: 1000,
				channel: message.sentMessage.channel,
				language: translationModule.language,
				reason: NumberChangeReason.MISSION_SHOP
			});
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
			await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
			draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.POINTS).then();
			return true;
		});
}

/**
 * Get the shop item for looking at the love you entertain with your pet
 * @param translationModule
 * @param interaction
 */
function getValueLovePointsPetShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"lovePointsValue",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.petId === null) {
				await sendErrorMessage(
					message.user,
					interaction,
					message.language,
					translationModule.get("error.noPet")
				);
				return false;
			}
			const sentenceGotten = translationModule.getRandom(`items.lovePointsValue.advice.${entity.Player.Pet.getLoveLevelNumber()}`);
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
			await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
			draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.PET_INFORMATION).then();
			return true;
		});
}

/**
 * Get the shop item for the badge in the mission shop
 * @param translationModule
 * @param interaction
 */
function getBadgeShopItem(translationModule: TranslationModule, interaction: CommandInteraction): ShopItem {
	return getItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge(Constants.BADGES.QUEST_MASTER)) {
				await sendErrorMessage(
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
					.setDescription(`${Constants.BADGES.QUEST_MASTER} ${translationModule.get("items.badge.name")}`)
				]
			});
			await MissionsController.update(entity, message.sentMessage.channel, message.language, {missionId: "spendGems"});
			draftBotInstance.logsDatabase.logMissionShopBuyout(message.user.id, ShopItemType.BADGE).then();
			return true;
		}
	);
}

/**
 * Displays the mission shop
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
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

const currentCommandFrenchTranslations = Translations.getModule("commands.missionShop", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.missionShop", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD, EffectsConstants.EMOJI_TEXT.LOCKED]
	},
	mainGuildCommand: false
};