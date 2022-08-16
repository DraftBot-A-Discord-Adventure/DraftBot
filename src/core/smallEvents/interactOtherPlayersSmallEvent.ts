import {SmallEvent} from "./SmallEvent";
import Entity, {Entities} from "../database/game/models/Entity";
import {CommandInteraction, TextBasedChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Constants} from "../Constants";
import {Guild, Guilds} from "../database/game/models/Guild";
import Player, {Players} from "../database/game/models/Player";
import {MapLocations} from "../database/game/models/MapLocation";
import {MissionsController} from "../missions/MissionsController";
import {Classes} from "../database/game/models/Class";
import {BlockingUtils} from "../utils/BlockingUtils";
import {TranslationModule, Translations} from "../Translations";
import {draftBotClient} from "../bot";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };

/**
 * Check top interactions
 * @param otherPlayer
 * @param cList
 */
function checkTop(otherPlayer: Player, cList: string[]) {
	if (otherPlayer.rank === 1) {
		cList.push("top1");
	}
	else if (otherPlayer.rank <= 10) {
		cList.push("top10");
	}
	else if (otherPlayer.rank <= 50) {
		cList.push("top50");
	}
	else if (otherPlayer.rank <= 100) {
		cList.push("top100");
	}
}

/**
 * Check badge interactions
 * @param otherEntity
 * @param cList
 */
function checkBadges(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.badges) {
		if (otherEntity.Player.badges.includes(Constants.BADGES.POWERFUL_GUILD)) {
			cList.push("powerfulGuild");
		}
		if (otherEntity.Player.badges.includes(Constants.BADGES.STAFF_MEMBER)) {
			cList.push("staffMember");
		}
	}
}

/**
 * Check level interactions
 * @param otherEntity
 * @param cList
 */
function checkLevel(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.level < 10) {
		cList.push("beginner");
	}
	else if (otherEntity.Player.level >= 50) {
		cList.push("advanced");
	}
}

/**
 * Check class interactions
 * @param otherEntity
 * @param entity
 * @param cList
 */
function checkClass(otherEntity: Entity, entity: Entity, cList: string[]) {
	if (otherEntity.Player.class && otherEntity.Player.class === entity.Player.class) {
		cList.push("sameClass");
	}
}

/**
 * Check guild interactions
 * @param otherEntity
 * @param entity
 * @param cList
 */
function checkGuild(otherEntity: Entity, entity: Entity, cList: string[]) {
	if (otherEntity.Player.guildId && otherEntity.Player.guildId === entity.Player.guildId) {
		cList.push("sameGuild");
	}
}

/**
 * Check topWeek interactions
 * @param otherPlayer
 * @param cList
 */
function checkTopWeek(otherPlayer: Player, cList: string[]) {
	if (otherPlayer.weeklyRank <= 5) {
		cList.push("topWeek");
	}
}

/**
 * Check health interactions
 * @param otherEntity
 * @param cList
 */
async function checkHealth(otherEntity: Entity, cList: string[]) {
	const healthPercentage = otherEntity.health / await otherEntity.getMaxHealth();
	if (healthPercentage < 0.2) {
		cList.push("lowHP");
	}
	else if (healthPercentage === 1.0) {
		cList.push("fullHP");
	}
}

/**
 * Check ranking interactions
 * @param otherPlayer
 * @param numberOfPlayers
 * @param cList
 * @param player
 */
function checkRanking(otherPlayer: Player, numberOfPlayers: number, cList: string[], player: Player) {
	if (otherPlayer.rank >= numberOfPlayers) {
		cList.push("unranked");
	}
	else if (otherPlayer.rank < player.rank) {
		cList.push("lowerRankThanHim");
	}
	else if (otherPlayer.rank > player.rank) {
		cList.push("betterRankThanHim");
	}
}

/**
 * Check money interactions
 * @param otherEntity
 * @param cList
 * @param entity
 */
function checkMoney(otherEntity: Entity, cList: string[], entity: Entity) {
	if (otherEntity.Player.money > 20000) {
		cList.push("rich");
	}
	else if (entity.Player.money > 0 && otherEntity.Player.money < 200) {
		cList.push("poor");
	}
}

/**
 * Check pet interactions
 * @param otherEntity
 * @param cList
 */
function checkPet(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.petId) {
		cList.push("pet");
	}
}

/**
 * Check guild responsibilities interactions
 * @param otherEntity
 * @param guild
 * @param cList
 */
async function checkGuildResponsabilities(otherEntity: Entity, guild: Guild, cList: string[]) {
	if (otherEntity.Player.guildId) {
		guild = await Guilds.getById(otherEntity.Player.guildId);
		if (guild.chiefId === otherEntity.Player.id) {
			cList.push("guildChief");
		}
		else if (guild.elderId === otherEntity.Player.id) {
			cList.push("guildElder");
		}
	}
	return guild;
}

/**
 * Check effect interactions
 * @param otherEntity
 * @param tr
 * @param cList
 */
function checkEffects(otherEntity: Entity, tr: TranslationModule, cList: string[]) {
	if (!otherEntity.Player.checkEffect() && tr.get(otherEntity.Player.effect)) {
		cList.push(otherEntity.Player.effect);
	}
}

/**
 * Check inventory interactions
 * @param otherEntity
 * @param cList
 */
function checkInventory(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.getMainWeaponSlot().itemId !== 0) {
		cList.push("weapon");
	}
	if (otherEntity.Player.getMainArmorSlot().itemId !== 0) {
		cList.push("armor");
	}
	if (otherEntity.Player.getMainPotionSlot().itemId !== 0) {
		cList.push("potion");
	}
	if (otherEntity.Player.getMainPotionSlot().itemId !== 0) {
		cList.push("object");
	}
}

/**
 * Select a random player on the same path
 * @param playersOnMap
 * @returns {Player}
 */
function selectAPlayer(playersOnMap: { discordUserId: string }[]): string {
	// We don't query other shards, it's not optimized
	let selectedPlayer: string = null;
	for (let i = 0; i < playersOnMap.length; ++i) {
		if (draftBotClient.users.cache.has(playersOnMap[i].discordUserId)) {
			selectedPlayer = playersOnMap[i].discordUserId;
			break;
		}
	}
	return selectedPlayer;
}

/**
 * Get the display of an Entity
 * @param tr
 * @param otherEntity
 * @param numberOfPlayers
 */
async function getPlayerDisplay(tr: TranslationModule, otherEntity: Entity, numberOfPlayers: number) {
	return format(tr.get("playerDisplay"), {
		pseudo: await otherEntity.Player.getPseudo(tr.language),
		rank: await Players.getRankById(otherEntity.Player.id) > numberOfPlayers ?
			Translations.getModule("commands.profile", tr.language).get("ranking.unranked") :
			await Players.getRankById(otherEntity.Player.id)
	});
}

/**
 * Get the display of the otherEntity's pet
 * @param otherEntity
 * @param language
 */
function getPetName(otherEntity: Entity, language: string) {
	return otherEntity.Player.Pet
		? otherEntity.Player.Pet.getPetEmote() + " "
		+ (otherEntity.Player.Pet.nickname ? otherEntity.Player.Pet.nickname : otherEntity.Player.Pet.getPetTypeName(language))
		: "";
}

/**
 * Send a coin from the current player to the interacted one
 * @param otherEntity
 * @param channel
 * @param language
 * @param entity
 */
async function sendACoin(otherEntity: Entity, channel: TextBasedChannel, language: string, entity: Entity) {
	await otherEntity.Player.addMoney(otherEntity, 1, channel, language, NumberChangeReason.RECEIVE_COIN);
	await otherEntity.Player.save();
	await entity.Player.addMoney(entity, -1, channel, language, NumberChangeReason.SMALL_EVENT);
	await entity.Player.save();
}

/**
 * Get the needed item if the selected interaction needs one
 * @param characteristic
 * @param otherEntity
 */
async function getItemIfNeeded(characteristic: string, otherEntity: Entity) {
	switch (characteristic) {
	case "weapon":
		return await otherEntity.Player.getMainWeaponSlot().getItem();
	case "armor":
		return await otherEntity.Player.getMainArmorSlot().getItem();
	case "potion":
		return await otherEntity.Player.getMainPotionSlot().getItem();
	case "object":
		return await otherEntity.Player.getMainObjectSlot().getItem();
	default:
		return null;
	}
}

/**
 * Get the prefix(es) for the item's display if needed
 * @param item
 */
function getPrefixes(item: GenericItemModel) {
	let prefixItem, prefixItem2 = "";
	if (item) {
		if (item.frenchPlural) {
			prefixItem = "ses";
		}
		else if (item.frenchMasculine) {
			prefixItem = "son";
		}
		else if (new RegExp(/\*(?=[AEIOUYÉÈH])/).test(item.fr)) {
			prefixItem = "son";
			prefixItem2 = "sa";
		}
		else {
			prefixItem = "sa";
		}
	}
	return {prefixItem, prefixItem2};
}

/**
 * Send and manage the poor interaction
 * @param textInformations
 * @param otherEntity
 * @param entity
 * @param seEmbed
 */
async function sendAndManagePoorInteraction(textInformations: TextInformations, otherEntity: Entity, entity: Entity, seEmbed: DraftBotEmbed) {
	await new DraftBotReactionMessageBuilder()
		.allowUser(textInformations.interaction.user)
		.addReaction(new DraftBotReaction(Constants.SMALL_EVENT.COIN_EMOTE))
		.addReaction(new DraftBotReaction(Constants.MENU_REACTION.DENY))
		.endCallback(async (reactMsg) => {
			const reaction = reactMsg.getFirstReaction();
			const poorEmbed = new DraftBotEmbed()
				.formatAuthor(Translations.getModule("commands.report", textInformations.tr.language).get("journal"), textInformations.interaction.user);
			if (reaction && reaction.emoji.name === Constants.SMALL_EVENT.COIN_EMOTE) {
				await sendACoin(otherEntity, textInformations.interaction.channel, textInformations.tr.language, entity);
				poorEmbed.setDescription(format(textInformations.tr.getRandom("poorGiveMoney"), {
					pseudo: await otherEntity.Player.getPseudo(textInformations.tr.language)
				}));
			}
			else {
				poorEmbed.setDescription(format(textInformations.tr.getRandom("poorDontGiveMoney"), {
					pseudo: await otherEntity.Player.getPseudo(textInformations.tr.language)
				}));
			}
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.REPORT);
			await textInformations.interaction.channel.send({embeds: [poorEmbed]});
		})
		.build()
		.setDescription(seEmbed.description)
		.setAuthor(seEmbed.author)
		.editReply(textInformations.interaction, collector => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.REPORT, collector));
}

/**
 * Get all available interactions, considering both entities
 * @param otherEntity
 * @param entity
 * @param numberOfPlayers
 * @param tr
 */
async function getAvailableInteractions(otherEntity: Entity, entity: Entity, numberOfPlayers: number, tr: TranslationModule) {
	const player = await Players.getById(entity.Player.id);
	const otherPlayer = await Players.getById(otherEntity.Player.id);
	let guild = null;
	const cList: string[] = [];
	checkTop(otherPlayer, cList);
	checkBadges(otherEntity, cList);
	checkLevel(otherEntity, cList);
	checkClass(otherEntity, entity, cList);
	checkGuild(otherEntity, entity, cList);
	checkTopWeek(otherPlayer, cList);
	await checkHealth(otherEntity, cList);
	checkRanking(otherPlayer, numberOfPlayers, cList, player);
	checkMoney(otherEntity, cList, entity);
	checkPet(otherEntity, cList);
	guild = await checkGuildResponsabilities(otherEntity, guild, cList);
	cList.push("class");
	checkEffects(otherEntity, tr, cList);
	checkInventory(otherEntity, cList);
	return {guild, cList};
}

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const numberOfPlayers = await Player.count({
			where: {
				score: {
					[require("sequelize/lib/operators").gt]: 100
				}
			}
		});
		const playersOnMap = await MapLocations.getPlayersOnMap(await entity.Player.getDestinationId(), await entity.Player.getPreviousMapId(), entity.Player.id);
		const tr = Translations.getModule("smallEvents.interactOtherPlayers", language);
		const selectedPlayerId = selectAPlayer(playersOnMap);
		if (!selectedPlayerId) {
			seEmbed.setDescription(seEmbed.description + tr.getRandom("no_one"));
			return await interaction.reply({embeds: [seEmbed]});
		}
		const [otherEntity] = await Entities.getOrRegister(selectedPlayerId);
		await MissionsController.update(entity, interaction.channel, language, {
			missionId: "meetDifferentPlayers",
			params: {metPlayerDiscordId: otherEntity.discordUserId}
		});
		const {guild, cList} = await getAvailableInteractions(otherEntity, entity, numberOfPlayers, tr);
		const characteristic = RandomUtils.draftbotRandom.pick(cList);
		const item = await getItemIfNeeded(characteristic, otherEntity);
		const {prefixItem, prefixItem2} = getPrefixes(item);

		seEmbed.setDescription(seEmbed.description + format(tr.getRandom(characteristic), {
			playerDisplay: await getPlayerDisplay(tr, otherEntity, numberOfPlayers),
			level: otherEntity.Player.level,
			class: (await Classes.getById(otherEntity.Player.class)).getName(language),
			advice: Translations.getModule("advices", language).getRandom("advices"),
			petName: getPetName(otherEntity, language),
			guildName: guild ? guild.name : "",
			item: item ? item.getName(language) : "",
			pluralItem: item ? item.frenchPlural ? "s" : "" : "",
			prefixItem: prefixItem,
			prefixItem2: prefixItem2 !== "" ? prefixItem2 : prefixItem
		}));

		if (characteristic === "poor") {
			await interaction.deferReply();
			await sendAndManagePoorInteraction({interaction, tr}, otherEntity, entity, seEmbed);
		}
		else {
			await interaction.reply({embeds: [seEmbed]});
		}

		console.log(entity.discordUserId + " interacted with a player");
	}
};