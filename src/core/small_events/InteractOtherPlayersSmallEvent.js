/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	let selectedPlayer = null;
	let playersOnMap = await MapLocations.getPlayersOnMap(entity.Player.map_id, entity.Player.previous_map_id, entity.Player.id);
	for (let i = 0; i < playersOnMap.length; ++i) {
		if (client.users.cache.has(playersOnMap[i].discordUser_id)) {
			selectedPlayer = playersOnMap[i];
			break;
		}
	}

	const tr = JsonReader.small_events.InteractOtherPlayers.getTranslation(language);
	if (!selectedPlayer) {
		seEmbed.setDescription(seEmbed.description + tr.no_one[randInt(0, tr.no_one.length)]);
		return await message.channel.send(seEmbed);
	} else {
		let [otherEntity] = await Entities.getOrRegister(selectedPlayer.discordUser_id);
		const cList = [];

		const player = (await Players.getById(entity.Player.id))[0];
		const otherPlayer = (await Players.getById(otherEntity.Player.id))[0];
		let item = null;
		let guild = null;
		console.log(otherPlayer.rank);
		if (otherPlayer.rank === 1) {
			cList.push("top1");
		} else if (otherPlayer.rank <= 10) {
			cList.push("top10");
		} else if (otherPlayer.rank <= 50) {
			cList.push("top50");
		} else if (otherPlayer.rank <= 100) {
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
		} else if (otherEntity.Player.level >= 50) {
			cList.push("advanced");
		}
		/*if (otherEntity.Player.isInactive()) {
			cList.push("inactive");
		}*/
		if (otherEntity.Player.class && otherEntity.Player.class === entity.Player.class) {
			cList.push("sameClass");
		}
		if (otherEntity.Player.guild_id && otherEntity.Player.guild_id === entity.Player.guild_id) {
			cList.push("sameGuild");
		}
		if (otherPlayer.weeklyRank <= 5) {
			cList.push("topWeek");
		}
		const healthPercentage = otherEntity.health / await otherEntity.getMaxHealth();
		if (healthPercentage < 0.2) {
			cList.push("lowHP");
		} else if (healthPercentage === 1.0) {
			cList.push("fullHP");
		}
		if (otherPlayer.rank < player.rank) {
			cList.push("lowerRankThanHim");
		} else if (otherPlayer.rank > player.rank) {
			cList.push("betterRankThanHim");
		}
		if (otherEntity.Player.money > 20000) {
			cList.push("rich");
		} else if (entity.Player.money > 0 && otherEntity.Player.money < 200) {
			cList.push("poor");
		}
		if (otherEntity.Player.Inventory.potion_id !== JsonReader.models.inventories.potion_id && entity.Player.Inventory.potion_id === JsonReader.models.inventories.potion_id) {
			cList.push("duplicatePotion");
		}
		if (otherEntity.Player.pet_id) {
			cList.push("pet");
		}
		if (otherEntity.Player.guild_id) {
			guild = await Guilds.getById(otherEntity.Player.guild_id);
			if (guild.chief_id === otherEntity.Player.id) {
				cList.push("guildChief");
			} else if (guild.elder_id === otherEntity.Player.id) {
				cList.push("guildElder");
			}
		}
		cList.push("class");
		if (!otherEntity.checkEffect() && tr[otherentity.Player.effect]) {
			cList.push(otherentity.Player.effect);
		}
		if (otherEntity.Player.Inventory.weapon_id !== JsonReader.models.inventories.weapon_id) {
			cList.push("weapon");
		}
		if (otherEntity.Player.Inventory.armor_id !== JsonReader.models.inventories.armor_id) {
			cList.push("armor");
		}
		if (otherEntity.Player.Inventory.potion_id !== JsonReader.models.inventories.potion_id) {
			cList.push("potion");
		}
		if (otherEntity.Player.Inventory.object_id !== JsonReader.models.inventories.object_id) {
			cList.push("object");
		}

		const characteristic = cList[randInt(0, cList.length)];
		console.log(cList);
		console.log(characteristic);
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
		}
		let prefix_item = "";
		if (item) {
			if (item.french_plural === 1) {
				prefix_item = "ses";
			} else {
				if (item.french_masculine === 1) {
					prefix_item = "son";
				} else {
					prefix_item = "sa";
				}
			}
		}

		seEmbed.setDescription(seEmbed.description + format(tr[characteristic][randInt(0, tr[characteristic].length)], {
			pseudo: await otherEntity.Player.getPseudo(language),
			level: otherEntity.Player.level,
			class: (await Classes.getById(otherEntity.Player.class))[language],
			advice: JsonReader.advices.getTranslation(language).advices[randInt(0, JsonReader.advices.getTranslation(language).advices.length)],
			pet_name: otherEntity.Player.Pet ? (PetEntities.getPetEmote(otherEntity.Player.Pet) + " " + (otherEntity.Player.Pet.nickname ? otherEntity.Player.Pet.nickname : PetEntities.getPetTypeName(otherEntity.Player.Pet, language))) : "",
			guild_name: guild ? guild.name : "",
			item: item ? item[language] : "",
			plural_item: item ? (item.french_plural === 1 ? "s" : "") : "",
			prefix_item: prefix_item,
		}));
		const msg = await message.channel.send(seEmbed);

		switch (characteristic) {
			case "poor":
				const COIN_EMOTE = "🪙";
				const collector = msg.createReactionCollector((reaction, user) => {
					return [COIN_EMOTE, MENU_REACTION.DENY].indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id;
				}, {time: COLLECTOR_TIME});
				addBlockedPlayer(entity.discordUser_id, "report", collector);
				collector.on('collect', async () => {
					collector.stop();
				});
				collector.on('end', async (reaction) => {
					const poorEmbed = new discord.MessageEmbed();
					poorEmbed.setAuthor(format(JsonReader.commands.report.getTranslation(language).journal, {
						pseudo: message.author.username
					}), message.author.displayAvatarURL());
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
				entity.Player.Inventory.potion_id = otherEntity.Player.Inventory.potion_id;
				await entity.Player.Inventory.save();
				break;
		}
	}
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};