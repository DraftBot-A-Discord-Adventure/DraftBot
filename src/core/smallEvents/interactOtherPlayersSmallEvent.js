/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

const executeSmallEvent = async function(message, language, entity, seEmbed) {
	let selectedPlayer = null;
	const playersOnMap = await MapLocations.getPlayersOnMap(await entity.Player.getDestinationId(), await entity.Player.getPreviousMapId(), entity.Player.id);
	for (let i = 0; i < playersOnMap.length; ++i) {
		if (client.users.cache.has(playersOnMap[i].discordUserId)) {
			selectedPlayer = playersOnMap[i];
			break;
		}
	}

	const tr = JsonReader.smallEvents.interactOtherPlayers.getTranslation(language);
	if (!selectedPlayer) {
		seEmbed.setDescription(seEmbed.description + tr.no_one[randInt(0, tr.no_one.length)]);
		return await message.channel.send(seEmbed);
	}
	const [otherEntity] = await Entities.getOrRegister(selectedPlayer.discordUserId);
	const cList = [];

	const player = (await Players.getById(entity.Player.id))[0];
	const otherPlayer = (await Players.getById(otherEntity.Player.id))[0];
	let item = null;
	let guild = null;
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
	if (otherEntity.Player.badges) {
		if (otherEntity.Player.badges.includes("💎")) {
			cList.push("powerfulGuild");
		}
		if (otherEntity.Player.badges.includes("⚙️")) {
			cList.push("staffMember");
		}
	}
	if (otherEntity.Player.level < 10) {
		cList.push("beginner");
	}
	else if (otherEntity.Player.level >= 50) {
		cList.push("advanced");
	}
	if (otherEntity.Player.class && otherEntity.Player.class === entity.Player.class) {
		cList.push("sameClass");
	}
	if (otherEntity.Player.guildId && otherEntity.Player.guildId === entity.Player.guildId) {
		cList.push("sameGuild");
	}
	if (otherPlayer.weeklyRank <= 5) {
		cList.push("topWeek");
	}
	const healthPercentage = otherEntity.health / await otherEntity.getMaxHealth();
	if (healthPercentage < 0.2) {
		cList.push("lowHP");
	}
	else if (healthPercentage === 1.0) {
		cList.push("fullHP");
	}
	if (otherPlayer.rank < player.rank) {
		cList.push("lowerRankThanHim");
	}
	else if (otherPlayer.rank > player.rank) {
		cList.push("betterRankThanHim");
	}
	if (otherEntity.Player.money > 20000) {
		cList.push("rich");
	}
	else if (entity.Player.money > 0 && otherEntity.Player.money < 200) {
		cList.push("poor");
	}
	if (otherEntity.Player.Inventory.potionId !== JsonReader.models.inventories.potionId && entity.Player.Inventory.potionId === JsonReader.models.inventories.potionId) {
		cList.push("duplicatePotion");
	}
	if (otherEntity.Player.petId) {
		cList.push("pet");
	}
	if (otherEntity.Player.guildId) {
		guild = await Guilds.getById(otherEntity.Player.guildId);
		if (guild.chiefId === otherEntity.Player.id) {
			cList.push("guildChief");
		}
		else if (guild.elderId === otherEntity.Player.id) {
			cList.push("guildElder");
		}
	}
	cList.push("class");
	if (!otherEntity.Player.checkEffect() && tr[otherEntity.Player.effect]) {
		cList.push(otherEntity.Player.effect);
	}
	if (otherEntity.Player.Inventory.weaponId !== JsonReader.models.inventories.weaponId) {
		cList.push("weapon");
	}
	if (otherEntity.Player.Inventory.armorId !== JsonReader.models.inventories.armorId) {
		cList.push("armor");
	}
	if (otherEntity.Player.Inventory.potionId !== JsonReader.models.inventories.potionId) {
		cList.push("potion");
	}
	if (otherEntity.Player.Inventory.objectId !== JsonReader.models.inventories.objectId) {
		cList.push("object");
	}

	const characteristic = cList[randInt(0, cList.length)];
	switch (characteristic) {
	case "weapon":
		item = await otherEntity.Player.Inventory.getWeapon();
		break;
	case "armor":
		item = await otherEntity.Player.Inventory.getArmor();
		break;
	case "duplicatePotion":
	case "potion":
		item = await otherEntity.Player.Inventory.getPotion();
		break;
	case "object":
		item = await otherEntity.Player.Inventory.getActiveObject();
		break;
	default:
		break;
	}
	let prefixItem = "";
	if (item) {
		if (item.frenchPlural === 1) {
			prefixItem = "ses";
		}
		else if (item.frenchMasculine === 1) {
			prefixItem = "son";
		}
		else {
			prefixItem = "sa";
		}
	}

	seEmbed.setDescription(seEmbed.description + format(tr[characteristic][randInt(0, tr[characteristic].length)], {
		pseudo: await otherEntity.Player.getPseudo(language),
		level: otherEntity.Player.level,
		class: (await Classes.getById(otherEntity.Player.class))[language],
		advice: JsonReader.advices.getTranslation(language).advices[randInt(0, JsonReader.advices.getTranslation(language).advices.length)],
		petName: otherEntity.Player.Pet
			? otherEntity.Player.Pet.getPetEmote() + " "
			+ (otherEntity.Player.Pet.nickname ? otherEntity.Player.Pet.nickname : PetEntities.getPetTypeName(otherEntity.Player.Pet, language))
			: "",
		guildName: guild ? guild.name : "",
		item: item ? item[language] : "",
		pluralItem: item ? item.frenchPlural === 1 ? "s" : "" : "",
		prefixItem: prefixItem
	}));
	const msg = await message.channel.send(seEmbed);

	const COIN_EMOTE = "🪙";
	const collector = msg.createReactionCollector((reaction, user) => [COIN_EMOTE, MENU_REACTION.DENY].indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id, {time: COLLECTOR_TIME});
	switch (characteristic) {
	case "poor":
		addBlockedPlayer(entity.discordUserId, "report", collector);
		collector.on("collect", () => {
			collector.stop();
		});
		collector.on("end", async (reaction) => {
			const poorEmbed = new DraftBotEmbed()
				.formatAuthor(JsonReader.commands.report.getTranslation(language).journal, message.author);
			if (reaction.first() && reaction.first().emoji.name === COIN_EMOTE) {
				otherEntity.Player.money += 1;
				await otherEntity.Player.save();
				entity.Player.money -= 1;
				await entity.Player.save();
				poorEmbed.setDescription(format(tr.poorGiveMoney[randInt(0, tr.poorGiveMoney.length)], {
					pseudo: await otherEntity.Player.getPseudo(language)
				}));
			}
			else {
				poorEmbed.setDescription(format(tr.poorDontGiveMoney[randInt(0, tr.poorDontGiveMoney.length)], {
					pseudo: await otherEntity.Player.getPseudo(language)
				}));
			}
			await message.channel.send(poorEmbed);
		});
		await msg.react(COIN_EMOTE);
		await msg.react(MENU_REACTION.DENY);
		break;
	case "duplicatePotion":
		entity.Player.Inventory.potionId = otherEntity.Player.Inventory.potionId;
		await entity.Player.Inventory.save();
		break;
	default:
		break;
	}

	log(entity.discordUserId + " interacted with a player");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};