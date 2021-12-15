import {
	DraftBotShopMessage,
	DraftBotShopMessageBuilder,
	ShopItem,
	ShopItemCategory
} from "../../core/messages/DraftBotShopMessage";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {Entities} from "../../core/models/Entity";

import {Collector, Message, TextChannel, User} from "discord.js";
import {generateRandomItem, giveItemToPlayer} from "../../core/utils/ItemUtils";
import {DraftBotReactionMessageBuilder} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";
import {MissionsController} from "../../core/missions/MissionsController";

declare function removeBlockedPlayer(id: string): void;

declare function addBlockedPlayer(id: string, reason: string, collector: Collector<any, any, any[]>): void;

declare function sendBlockedError(user: User, channel: TextChannel, language: string): Promise<boolean>;

module.exports.commandInfo = {
	name: "missionshop",
	aliases: ["ms", "mshop"],
	disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD, Constants.EFFECT.LOCKED]
};

/**
 * Displays the mission shop
 * @param {Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const MissionShopCommand = async (message: Message, language: string) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await sendBlockedError(message.author, <TextChannel> message.channel, language)) {
		return;
	}

	const shopTranslations = Translations.getModule("commands.missionShop", language);

	const resCategory = new ShopItemCategory(
		[
			getMoneyShopItem(shopTranslations),
			getValuableItemShopItem(shopTranslations),
			getAThousandPointsShopItem(shopTranslations)
		],
		shopTranslations.get("resTitle")
	);
	const utilCategory = new ShopItemCategory(
		[
			getSkipMapMissionShopItem(shopTranslations),
			getValueLovePointsPetShopItem(shopTranslations)
		],
		shopTranslations.get("utilTitle")
	);
	const presCategory = new ShopItemCategory(
		[
			getBadgeShopItem(shopTranslations)
		],
		shopTranslations.get("presTitle")
	);

	const shopMessage = await new DraftBotShopMessageBuilder(
		message.author,
		shopTranslations.get("title"),
		language
	)
		.addCategory(resCategory)
		.addCategory(utilCategory)
		.addCategory(presCategory)
		.endCallback(shopEndCallback)
		.setGetUserMoney(getUserGems)
		.setRemoveUserMoney(removeUserMoney)
		.setTranslationPosition("commands.missionShop")
		.build();

	addBlockedPlayer(entity.discordUserId, "missionShop", shopMessage.collector);
	await shopMessage.send(message.channel);
};


const getUserGems = async (userId: string): Promise<number> => {
	const user = (await Entities.getOrRegister(userId))[0].Player;
	return user.PlayerMissionsInfo.gems;
};

async function removeUserMoney(userId: string, amount: number): Promise<void> {
	const player = (await Entities.getByDiscordUserId(userId)).Player;
	player.PlayerMissionsInfo.addGems(-amount);
	await player.PlayerMissionsInfo.save();
}

function shopEndCallback(shopMessage: DraftBotShopMessage) {
	removeBlockedPlayer(shopMessage.user.id);
}

function getItemShopItem(name: string, translationModule: TranslationModule, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>): ShopItem {
	return new ShopItem(
		translationModule.get("items." + name + ".emote"),
		translationModule.get("items." + name + ".name"),
		parseInt(translationModule.get("items." + name + ".price")),
		translationModule.format("items." + name + ".info",
			{amount: Constants.MISSION_SHOP.RATIO_MONEY_GEMS}
		),
		buyCallback
	);
}

function getSkipMapMissionShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"skipMapMission",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			const allMissions = entity.Player.MissionSlots.filter(slot => !slot.isCampaign());
			if (!allMissions.length) {
				message.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
					message.user,
					message.language,
					translationModule.get("error.noMissionToSkip")
				)] });
				return false;
			}
			const chooseMission = new DraftBotReactionMessageBuilder()
				.allowUser(message.user)
				.endCallback(async (missionMessage) => {
					const reaction = missionMessage.getFirstReaction();
					if (!reaction || reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
						removeBlockedPlayer(message.user.id);
						await message.sentMessage.channel.send({
							embeds: [new DraftBotErrorEmbed(
								message.user,
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
											missionInfo: await allMissions[i].Mission.formatDescription(allMissions[i].missionObjective, allMissions[i].missionVariant, message.language)
										}))
								]
							});
							await allMissions[i].destroy();
							break;
						}
					}
					removeBlockedPlayer(message.user.id);
					await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
				});
			let desc = "";
			for (let i = 0; i < allMissions.length; ++i) {
				chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.NUMBERS[i + 1]));
				desc += Constants.REACTIONS.NUMBERS[i + 1] + " " + await allMissions[i].Mission.formatDescription(allMissions[i].missionObjective, allMissions[i].missionVariant, message.language) + "\n";
			}
			chooseMission.addReaction(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
			const chooseMissionBuilt = chooseMission.build();
			chooseMissionBuilt.formatAuthor(translationModule.get("items.skipMapMission.giveTitle"), message.user);
			chooseMissionBuilt.setDescription(translationModule.get("items.skipMapMission.giveDesc") + "\n\n" + desc);
			await chooseMissionBuilt.send(message.sentMessage.channel);
			addBlockedPlayer(entity.discordUserId, "missionShop", chooseMissionBuilt.collector);
			return false;
		});
}

function getMoneyShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"money",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			entity.Player.addMoney(entity, Constants.MISSION_SHOP.RATIO_MONEY_GEMS, <TextChannel> message.sentMessage.channel, translationModule.language);
			await message.sentMessage.channel.send(
				{
					embeds: [new DraftBotEmbed()
						.formatAuthor(translationModule.get("items.money.giveTitle"), message.user)
						.setDescription(translationModule.format("items.money.giveDescription", {amount: Constants.MISSION_SHOP.RATIO_MONEY_GEMS})
						)]
				});
			await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
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
			console.log(item.rarity);
			await giveItemToPlayer(entity, item, message.language, message.user, <TextChannel> message.sentMessage.channel);
			await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getAThousandPointsShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"1000Points",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.PlayerMissionsInfo.hasBoughtPointsThisWeek) {
				message.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
					message.user,
					message.language,
					translationModule.get("error.remainingCooldown")
				)] });
				return false;
			}
			entity.Player.addScore(entity, 1000, <TextChannel> message.sentMessage.channel, translationModule.language);
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
			await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getValueLovePointsPetShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"lovePointsValue",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.petId === null) {
				message.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
					message.user,
					message.language,
					translationModule.get("error.noPet")
				)] });
				return false;
			}
			const sentenceGotten = translationModule.getRandom("items.lovePointsValue.advice." + entity.Player.Pet.getLoveLevelNumber());
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("items.lovePointsValue.giveTitle"), message.user)
					.setDescription(translationModule.format("items.lovePointsValue.giveDesc", {
						pseudo: message.user.username,
						isFemale: entity.Player.Pet.sex === "f",
						petName: entity.Player.Pet.displayName(message.language),
						actualLP: entity.Player.Pet.lovePoints,
						commentOnResult: sentenceGotten
					}))
				]
			});
			await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
			return true;
		});
}

function getBadgeShopItem(translationModule: TranslationModule): ShopItem {
	return getItemShopItem(
		"badge",
		translationModule,
		async (message) => {
			const [entity] = await Entities.getOrRegister(message.user.id);
			if (entity.Player.hasBadge("💍")) {
				message.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
					message.user,
					message.language,
					translationModule.get("error.alreadyHasItem")
				)] });
				return false;
			}
			entity.Player.addBadge("💍");
			await entity.Player.save();
			await message.sentMessage.channel.send({
				embeds: [new DraftBotEmbed()
					.formatAuthor(translationModule.get("items.badge.give"), message.user)
					.setDescription("💍 " + translationModule.get("items.badge.name"))
				]
			});
			await MissionsController.update(message.user.id, <TextChannel> message.sentMessage.channel, message.language, "spendGems");
			return true;
		}
	);
}

module.exports.execute = MissionShopCommand;
