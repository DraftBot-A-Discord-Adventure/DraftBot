import {SmallEvent} from "./SmallEvent";
import Entity, {Entities} from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Constants} from "../Constants";
import {Guild, Guilds} from "../models/Guild";
import Player, {Players} from "../models/Player";
import {MapLocations} from "../models/MapLocation";
import {MissionsController} from "../missions/MissionsController";
import {Classes} from "../models/Class";
import {BlockingUtils} from "../utils/BlockingUtils";
import {TranslationModule, Translations} from "../Translations";
import {draftBotClient} from "../bot";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {RandomUtils} from "../utils/RandomUtils";

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

function checkLevel(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.level < 10) {
		cList.push("beginner");
	}
	else if (otherEntity.Player.level >= 50) {
		cList.push("advanced");
	}
}

function checkClass(otherEntity: Entity, entity: Entity, cList: string[]) {
	if (otherEntity.Player.class && otherEntity.Player.class === entity.Player.class) {
		cList.push("sameClass");
	}
}

function checkGuild(otherEntity: Entity, entity: Entity, cList: string[]) {
	if (otherEntity.Player.guildId && otherEntity.Player.guildId === entity.Player.guildId) {
		cList.push("sameGuild");
	}
}

function checkTopWeek(otherPlayer: Player, cList: string[]) {
	if (otherPlayer.weeklyRank <= 5) {
		cList.push("topWeek");
	}
}

async function checkHealth(otherEntity: Entity, cList: string[]) {
	const healthPercentage = otherEntity.health / await otherEntity.getMaxHealth();
	if (healthPercentage < 0.2) {
		cList.push("lowHP");
	}
	else if (healthPercentage === 1.0) {
		cList.push("fullHP");
	}
}

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

function checkMoney(otherEntity: Entity, cList: string[], entity: Entity) {
	if (otherEntity.Player.money > 20000) {
		cList.push("rich");
	}
	else if (entity.Player.money > 0 && otherEntity.Player.money < 200) {
		cList.push("poor");
	}
}

function checkPet(otherEntity: Entity, cList: string[]) {
	if (otherEntity.Player.petId) {
		cList.push("pet");
	}
}

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

function checkEffects(otherEntity: Entity, tr: TranslationModule, cList: string[]) {
	if (!otherEntity.Player.checkEffect() && tr.get(otherEntity.Player.effect)) {
		cList.push(otherEntity.Player.effect);
	}
}

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

async function getPlayerDisplay(tr: TranslationModule, otherEntity: Entity, numberOfPlayers: number) {
	return format(tr.get("playerDisplay"), {
		pseudo: await otherEntity.Player.getPseudo(tr.language),
		rank: (await Players.getById(otherEntity.Player.id)).rank > numberOfPlayers ?
			Translations.getModule("commands.profile", tr.language).get("ranking.unranked") :
			(await Players.getById(otherEntity.Player.id)).rank
	});
}

function getPetName(otherEntity: Entity, language: string) {
	return otherEntity.Player.Pet
		? otherEntity.Player.Pet.getPetEmote() + " "
		+ (otherEntity.Player.Pet.nickname ? otherEntity.Player.Pet.nickname : otherEntity.Player.Pet.getPetTypeName(language))
		: "";
}

async function sendACoin(otherEntity: Entity, channel: TextChannel, language: string, entity: Entity) {
	await otherEntity.Player.addMoney(otherEntity, 1, channel, language);
	await otherEntity.Player.save();
	await entity.Player.addMoney(entity, -1, channel, language);
	await entity.Player.save();
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
		const cList: string[] = [];
		const player = await Players.getById(entity.Player.id);
		const otherPlayer = await Players.getById(otherEntity.Player.id);
		await MissionsController.update(entity.discordUserId, <TextChannel> interaction.channel, language, "meetDifferentPlayers", 1, {metPlayerDiscordId: otherEntity.discordUserId});
		let guild = null;
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
		let item = null;
		const characteristic = RandomUtils.draftbotRandom.pick(cList);
		switch (characteristic) {
		case "weapon":
			item = await otherEntity.Player.getMainWeaponSlot().getItem();
			break;
		case "armor":
			item = await otherEntity.Player.getMainArmorSlot().getItem();
			break;
		case "potion":
			item = await otherEntity.Player.getMainPotionSlot().getItem();
			break;
		case "object":
			item = await otherEntity.Player.getMainObjectSlot().getItem();
			break;
		default:
			break;
		}
		let prefixItem = "";
		if (item) {
			if (item.frenchPlural) {
				prefixItem = "ses";
			}
			else if (item.frenchMasculine) {
				prefixItem = "son";
			}
			else {
				prefixItem = "sa";
			}
		}

		seEmbed.setDescription(seEmbed.description + format(tr.getRandom(characteristic), {
			playerDisplay: await getPlayerDisplay(tr, otherEntity, numberOfPlayers),
			level: otherEntity.Player.level,
			class: (await Classes.getById(otherEntity.Player.class)).getName(language),
			advice: Translations.getModule("advices", language).getRandom("advices"),
			petName: getPetName(otherEntity, language),
			guildName: guild ? guild.name : "",
			item: item ? item.getName(language) : "",
			pluralItem: item ? item.frenchPlural ? "s" : "" : "",
			prefixItem: prefixItem
		}));

		if (characteristic === "poor") {
			await new DraftBotReactionMessageBuilder()
				.allowUser(interaction.user)
				.addReaction(new DraftBotReaction(Constants.SMALL_EVENT.COIN_EMOTE))
				.endCallback(async (reactMsg) => {
					const reaction = reactMsg.getFirstReaction();
					const poorEmbed = new DraftBotEmbed()
						.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
					if (reaction && reaction.emoji.name === Constants.SMALL_EVENT.COIN_EMOTE) {
						await sendACoin(otherEntity, <TextChannel> interaction.channel, language, entity);
						poorEmbed.setDescription(format(tr.getRandom("poorGiveMoney"), {
							pseudo: await otherEntity.Player.getPseudo(language)
						}));
					}
					else {
						poorEmbed.setDescription(format(tr.getRandom("poorDontGiveMoney"), {
							pseudo: await otherEntity.Player.getPseudo(language)
						}));
					}
					BlockingUtils.unblockPlayer(entity.discordUserId);
					await interaction.channel.send({embeds: [poorEmbed]});
				})
				.build()
				.setTitle(seEmbed.title)
				.setDescription(seEmbed.description)
				.setAuthor(seEmbed.author)
				.reply(interaction, collector => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "report", collector));
		}
		else {
			await interaction.reply({embeds: [seEmbed]});
		}

		console.log(entity.discordUserId + " interacted with a player");
	}
};