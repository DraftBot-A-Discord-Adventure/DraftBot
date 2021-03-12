/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity) {
	console.log(await MapLocations.getRandomPlayerOnMap(entity.Player.map_id, entity.Player.previous_map_id, entity.Player.id));
	let otherEntity = Entities.getOrRegister(await MapLocations.getRandomPlayerOnMap(entity.Player.map_id, entity.Player.previous_map_id, entity.Player.id));
	console.log(otherEntity);
	console.log(JsonReader.small_events);
	const tr = JsonReader.small_events.InteractOtherPlayers.getTranslation(language);
	if (otherEntity.length === 0) {
		return await message.channel.send(tr.no_one[randInt(0, tr.no_one.length - 1)]);
	}
	else {
		const cList = [];

		const player = (await Players.getById(entity.Player.id))[0];
		const otherPlayer = (await Players.getById(otherEntity.Player.id))[0];
		if (otherPlayer.rank === 1) {
			cList.push("top1");
		}
		else if (otherPlayer.rank >= 10) {
			cList.push("top10");
		}
		else if (otherPlayer.rank >= 50) {
			cList.push("top50");
		}
		else if (otherPlayer.rank >= 100) {
			cList.push("top100");
		}
		if (otherPlayer.badges) {
			if (otherPlayer.badges.includes("💎")) {
				cList.push("powerfulGuild");
			}
			if (otherPlayer.badges.includes("⚙️")) {
				cList.push("staffMember")
			}
		}
		if (otherPlayer.level < 10) {
			cList.push("beginner");
		}
		else if (otherPlayer.level >= 50) {
			cList.push("advanced");
		}
		if (otherPlayer.isInactive()) {
			cList.push("inactive");
		}
		if (otherPlayer.class && otherPlayer.class === player.class) {
			cList.push("sameClass");
		}
		if (otherPlayer.guild_id && otherPlayer.guild_id === player.guild_id) {
			cList.push("sameGuild");
		}
		if (otherPlayer.weeklyRank >= 5) {
			cList.push("topWeek");
		}
		const healthPercentage = otherEntity.getCumulativeHealth() / otherEntity.getMaxCumulativeHealth();
		if (healthPercentage < 0.2) {
			cList.push("lowHP");
		}
		else if (healthPercentage === 1.0) {
			cList.push("fullHP");
		}
		if (otherPlayer.rank > player.rank) {
			cList.push("lowerRankThanHim");
		}
		else if (otherPlayer.rank < player.rank) {
			cList.push("betterRankThanHim");
		}
		if (otherPlayer.money > 20000) {
			cList.push("rich");
		}
		else if (otherPlayer.money < 200) {
			cList.push("poor");
		}
		if (otherEntity.Player.Inventory.potion_id !== JsonReader.models.inventories.potion_id && otherEntity.Player.Inventory.potion_id === JsonReader.models.inventories.potion_id) {
			cList.push("duplicatePotion");
		}
		if (otherPlayer.pet_id) {
			cList.push("pet");
		}
		if (otherPlayer.guild_id) {
			if (otherEntity.Player.Guild.chief_id === otherPlayer.id) {
				cList.push("guildChief");
			}
			else if (otherEntity.Player.Guild.elder_id === otherPlayer.id) {
				cList.push("guildElder");
			}
		}
		cList.push("class");
		if (tr[otherEntity.effect]) {
			cList.push(otherEntity.effect);
		}
		if (otherEntity.Player.Inventory.weapon_id !== JsonReader.models.inventoryes.weapon_id) {
			cList.push("weapon");
		}
		if (otherEntity.Player.Inventory.armor_id !== JsonReader.models.inventoryes.armor_id) {
			cList.push("armor");
		}
		if (otherEntity.Player.Inventory.potion_id !== JsonReader.models.inventoryes.potion_id) {
			cList.push("potion");
		}
		if (otherEntity.Player.Inventory.object_id !== JsonReader.models.inventoryes.object_id) {
			cList.push("object");
		}

		console.log(cList);
		const characteristic = cList[randInt(0, cList.length - 1)];
		const msg = await message.channel.send(format(tr[characteristic][randInt(0, tr[characteristic].length - 1)], {
			pseudo: otherEntity.getPseudo(language),
			level: otherPlayer.level,
			class: (await Classes.getById(otherPlayer.class))[language],
			advice: JsonReader.commands.report.getTranslation(language).advices[randInt(0, JsonReader.commands.report.getTranslation(language).advices.length - 1)],
			potion: 
		}));
		// TODO add reaction poor
		// TODO duplicate potion
		// TODO virer pseudos 404
	}
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};