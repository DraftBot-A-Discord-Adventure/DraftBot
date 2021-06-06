/* eslint-disable */

const Maps = require("../../core/Maps");
/**
 * Cheat command for testers
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const TestCommand = async (language, message, args) => {
	let authorized = false;

	if (JsonReader.app.TEST_MODE !== true) {
		return;
	} else {
		authorized = true;
	}

	if (!authorized) { // Additional security in case of error
		return;
	}

	if (args.length === 0) {
		await message.channel.send(":x: | Pas assez d'arguments");
		return;
	}

	let author;
	[author] = await Entities.getOrRegister(message.author.id);
	try {
		switch (args[0].toLowerCase()) {
		case "lvl":
		case "level":
			if (args.length === 2) {
				author.Player.level = parseInt(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test level <niveau>");
				return;
			}
			break;
		case "score":
			if (args.length === 2) {
				author.Player.score = parseInt(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test score <score>");
				return;
			}
			break;
		case "weeklyscore":
			if (args.length === 2) {
				author.Player.weeklyScore = parseInt(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test weeklyscore <score>");
				return;
			}
			break;
		case "xp":
		case "experience":
			if (args.length === 2) {
				author.Player.experience = parseInt(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test experience <experience>");
				return;
			}
			break;
		case "money":
			if (args.length === 2) {
				author.Player.money = parseInt(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test experience <experience>");
				return;
			}
			break;
		case "givebadge":
			if (args.length === 2) {
				author.Player.addBadge(args[1]);
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test givebadge <badge>");
				return;
			}
			break;
		case "clearbadges":
			if (args.length === 1) {
				author.Player.badges = null;
				author.Player.save();
			} else {
				await message.channel.send("Usage correct: test clearbadges");
				return;
			}
			break;
		case "maxhealth":
			if (args.length === 2) {
				author.maxHealth = parseInt(args[1]);
				author.save();
			} else {
				await message.channel.send("Usage correct: test maxhealth <max health>");
				return;
			}
			break;
		case "health":
			if (args.length === 2) {
				author.health = parseInt(args[1]);
				author.save();
			} else {
				await message.channel.send("Usage correct: test health <health>");
				return;
			}
			break;
		case "attack":
			if (args.length === 2) {
				author.attack = parseInt(args[1]);
				author.save();
			} else {
				await message.channel.send("Usage correct: test attack <attack>");
				return;
			}
			break;
		case "defense":
			if (args.length === 2) {
				author.defense = parseInt(args[1]);
				author.save();
			} else {
				await message.channel.send("Usage correct: test defense <defense>");
				return;
			}
			break;
		case "speed":
			if (args.length === 2) {
				author.speed = parseInt(args[1]);
				author.save();
			} else {
				await message.channel.send("Usage correct: test speed <speed>");
				return;
			}
			break;
		case "effect":
			if (args.length === 2) {
				let effectMalus = ":" + args[1] + ":";
				if (JsonReader.models.players.effectMalus[effectMalus]) {
					await Maps.applyEffect(author.Player, ":" + args[1] + ":");
					await author.Player.save();
				} else {
					await message.channel.send("Effet inconnu ! Il ne faut pas mettre les ::");
					return;
				}
			} else {
				await message.channel.send("Usage correct: test effect <effect>");
				return;
			}
			break;
		case "jail":
			if (message.mentions.users.first() === undefined) {
				await message.channel.send("Usage correct: test jail <mention>");
				return;
			}
			[entity] = await Entities.getOrRegister(message.mentions.users.first().id);
			await Maps.applyEffect(entity.Player, ":lock:");
			await entity.Player.save();
			break;
		case "weaponid":
			if (args.length === 2) {
				author.Player.Inventory.weapon_id = parseInt(args[1]);
				author.Player.Inventory.save();
			} else {
				await message.channel.send("Usage correct: test weaponId <weaponId>");
				return;
			}
			break;
		case "armorid":
			if (args.length === 2) {
				author.Player.Inventory.armor_id = parseInt(args[1]);
				author.Player.Inventory.save();
			} else {
				await message.channel.send("Usage correct: test armorId <armorId>");
				return;
			}
			break;
		case "potionid":
			if (args.length === 2) {
				author.Player.Inventory.potion_id = parseInt(args[1]);
				author.Player.Inventory.save();
			} else {
				await message.channel.send("Usage correct: test potionId <potionId>");
				return;
			}
			break;
		case "objectid":
			if (args.length === 2) {
				author.Player.Inventory.object_id = parseInt(args[1]);
				author.Player.Inventory.save();
			} else {
				await message.channel.send("Usage correct: test objectId <objectId>");
				return;
			}
			break;
		case "backupid":
			if (args.length === 2) {
				author.Player.Inventory.backup_id = parseInt(args[1]);
				author.Player.Inventory.save();
			} else {
				await message.channel.send("Usage correct: test backupId <backupId>");
				return;
			}
			break;
		case "init":
			author.Player.level = 1;
			author.Player.score = 2000;
			author.Player.weeklyScore = 0;
			author.Player.experience = 0;
			author.Player.money = 0;
			author.Player.badges = null;
			author.Player.effect_end_date = Date.now();
			author.Player.effect_duration = 0;
			await Maps.removeEffect(entity.Player);
			author.Player.start_travel_date = new Date();
			author.Player.save();

			author.maxHealth = 100;
			author.health = 100;
			author.attack = 50;
			author.defense = 20;
			author.speed = 10;
			author.save();

			author.Player.Inventory.weapon_id = 0;
			author.Player.Inventory.armor_id = 0;
			author.Player.Inventory.object_id = 0;
			author.Player.Inventory.backup_id = 0;
			author.Player.Inventory.save();
			break;
		case "destroy":
			Inventories.destroy({
				where: {
					player_id: author.Player.id
				}
			});
			Players.destroy({
				where: {
					entity_id: author.id
				}
			});
			Entities.destroy({
				where: {
					id: author.id
				}
			});
			break;
		case "forcereport":
		case "fr":
		case "forcer":
			if (args.length === 2) {
				await getCommand("r")(language, message, args, parseInt(args[1]));
			} else {
				await message.channel.send("Usage correct: test forcer <eventId>");
			}
			return;
		case "agd":
			if (args.length === 2) {
				let guild = await Guilds.findOne({where: {id: author.Player.guild_id}});
				guild.lastDailyAt -= parseInt(args[1]) * 60000;
				guild.save();
			}
			break;
		case "adaily":
			if (args.length === 2) {
				author.Player.Inventory.lastDailyAt -= parseInt(args[1]) * 60000;
				author.Player.Inventory.save();
			}
			break;
		case "glvl":
			if (args.length === 2 && !isNaN(args[1])) {
				let guild = await Guilds.findOne({where: {id: author.Player.guild_id}});
				guild.level = parseInt(args[1]);
				guild.save();
			}
			break;
		case "petlp":
			if (args.length === 2 && !isNaN(args[1])) {
				let pet = await author.Player.Pet;
				pet.lovePoints = parseInt(args[1]);
				pet.save();
			}
			break;
		case "gxp":
			if (args.length === 2 && !isNaN(args[1])) {
				let guild = await Guilds.findOne({where: {id: author.Player.guild_id}});
				guild.experience = parseInt(args[1]);
				guild.save();
			}
			break;
		case "fakevote":
			await require("../../core/DBL").userDBLVote(message.author.id);
			break;
		case "topggatime":
			author.Player.topggVoteAt -= parseInt(args[1]) * 60000;
			author.Player.save();
			break;
		case "fightpointslost":
		case "fpl":
			if (args.length === 2) {
				author.fightPointsLost = parseInt(args[1]);
				author.save();
			}
			break;
		case "forcejoinguild":
		case "fjg":
			if (args.length >= 2) {
				let guild = await Guilds.findOne({where: {id: author.Player.guild_id}});
				if (guild && guild.chief_id === author.Player.id) {
					// the chief is leaving : destroy the guild
					await Guilds.destroy({
						where: {
							id: guild.id,
						},
					});
				}
				guild = await Guilds.getByName(args.slice(1, args.length).join(" "));
				if (guild === null) {
					await message.channel.send("Guild not found");
					return;
				}
				author.Player.guild_id = guild.id;

				await Promise.all([
					guild.save(),
					author.save(),
					author.Player.save(),
				]);
				await message.channel.send("Guild joined");
				return;
			}
			break;
		case "forceguildowner":
		case "fgo":
			let guild = await Guilds.findOne({where: {id: author.Player.guild_id}});
			guild.chief_id = author.Player.id;
			await guild.save();
			break;
		case "pet":
			if (args.length === 3) {
				if (author.Player.Pet) {
					await author.Player.Pet.destroy();
				}
				if (args[1] === "0") {
					break;
				}
				const pet = PetEntities.createPet(parseInt(args[1]), args[2], null);
				await pet.save();
				author.Player.pet_id = pet.id;
				await author.Player.save();
				break;
			}
			await message.channel.send("Correct usage: test pet <id> <sex = m/f>");
			return;
		case "gp":
		case "guildpet":
			if (args.length === 3) {
				const guild = await Guilds.getById(author.Player.guild_id);
				if (!guild) {
					await message.channel.send("Not in a guild!");
					return;
				}
				if (Guilds.isPetShelterFull(guild)) {
					await message.channel.send("Guild's pet shelter full!");
					return;
				}
				const pet = PetEntities.createPet(parseInt(args[1]), args[2], null);
				await pet.save();
				await (await GuildPets.addPet(guild.id, pet.id)).save();
				break;
			}
			await message.channel.send("Correct usage: test guildpet <id> <sex = m/f>");
			return;
		case "apfree":
			if (args.length === 2) {
				author.Player.last_pet_free -= parseInt(args[1]) * 60000;
				author.Player.save();
			}
			break;
		case "pf":
		case "petfree":
			author.Player.pet_id = null;
			break;
		case "greward":
			await getCommand("gd")(language, message, [], args[1]);
			break;
		case "block":
			let sec = parseInt(args[1]);
			const msg = await message.channel.send(":clock2: You're now blocked for " + sec + " seconds!");
			let collector = msg.createReactionCollector(() => {
				return true;
			}, {
				time: sec * 1000
			});
			collector.on("collect", () => {
			});
			collector.on("end", () => {
			});
			addBlockedPlayer(author.discordUser_id, "test", collector);
			break;
		case "dailytimeout":
			require("../../core/DraftBot").dailyTimeout();
			break;
		case "mapinfo":
			const mapEmbed = new discord.MessageEmbed();
			const currMap = await MapLocations.getById(author.Player.map_id);
			const prevMap = await MapLocations.getById(author.Player.previous_map_id);
			const travelling = Maps.isTravelling(author.Player);
			mapEmbed.setTitle(":map: Map debugging");
			mapEmbed.addField(travelling ? "Next map" : "Current map", currMap.getDisplayName(language) + " (id: " + currMap.id + ")", true);
			mapEmbed.addField("Previous map", prevMap ? prevMap.getDisplayName(language) + " (id: " + prevMap.id + ")" : "None", true);
			mapEmbed.addField("Travelling", Maps.isTravelling(author.Player) ? ":clock1: For " + minutesToString(millisecondsToMinutes(Maps.getTravellingTime(author.Player))) : ":x: No", true);
			if (!travelling) {
				const availableMaps = await Maps.getNextPlayerAvailableMaps(author.Player);
				let field = "";
				for (let i = 0; i < availableMaps.length; ++i) {
					const map = await MapLocations.getById(availableMaps[i]);
					field += map.getDisplayName(language) + " (id: " + map.id + ")" + "\n";
				}
				mapEmbed.addField("Next available maps", field, true);
			} else {
				mapEmbed.addField("Players", ":speech_balloon: " + await currMap.playersCount() + " player(s) on this map", true);
			}
			return await message.channel.send(mapEmbed);
		case "travel":
			if (args.length === 2) {
				//const availableMaps = await Maps.getNextPlayerAvailableMaps(author.Player);
				const nextId = parseInt(args[1]);
				/*if (!availableMaps.includes(nextId)) {
						await message.channel.send("You cannot go to this map from there. Available ids: " + availableMaps);
						return;
					}*/
				await Maps.startTravel(author.Player, nextId, message.createdAt.getTime());
			} else {
				await message.channel.send("Correct usage: travel <map id>");
				return;
			}
			break;
		case "stoptravel":
		case "stravel":
			await Maps.stopTravel(author.Player);
			break;
		case "travelreport":
		case "tr":
			author.Player.start_travel_date = new Date(0);
			author.Player.effect_end_date = new Date(0);
			await author.Player.save();
			break;
		case "tp":
			if (args.length === 2) {
				const id = parseInt(args[1]);
				const map = await MapLocations.getById(id);
				if (!map) {
					await message.channel.send("This map doesn't exist");
					return;
				}
				author.Player.map_id = id;
				await author.Player.save();
				break;
			} else {
				await message.channel.send("Correct usage: tp <map id>");
				return;
			}
		case "atravel":
			if (args.length === 2) {
				Maps.advanceTime(author.Player, parseInt(args[1]));
				author.Player.save();
				break;
			} else {
				await message.channel.send("Correct usage: atravel <time in minutes>");
				return;
			}
		case "small_event":
			if (args.length === 2) {
				if (JsonReader.small_events[args[1]] === undefined) {
					await message.channel.send("Unknown small event type");
					return;
				}
				await getCommand("r")(language, message, args, -1, args[1]);
				return;
			} else {
				await message.channel.send("Correct usage: small_event <type>");
				return;
			}
		case "suicide":
			author.health = 0;
			await author.Player.killIfNeeded(author, message.channel, language);
			await Promise.all([author.save(), author.Player.save()]);
			break;
		case "forcetwe":
			await require("../../core/DraftBot").twe();
			break;
		case "myids":
			await message.channel.send("Entity id: " + author.id + ", player id: " + author.Player.id);
			return;
		case "rmeffect":
			await Maps.removeEffect(author.Player);
			await author.Player.save();
			break;
		default:
			await message.channel.send("Argument inconnu !");
			return;
		}
	} catch (error) {
		console.log(error);
		await message.channel.send(":x: | Une erreur est survenue pendant la commande !");
		return;
	}
	await message.channel.send(":man_mage: | Commande test reconnue et appliquée !");
};

module.exports = {
	commands: [
		{
			name: "test",
			func: TestCommand
		}
	]
};