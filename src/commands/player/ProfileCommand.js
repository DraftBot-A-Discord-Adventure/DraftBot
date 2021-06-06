/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
	let [entity] = await Entities.getByArgs(args, message);
	if (entity === null) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY], entity) !== true) {
		return;
	}

	let titleEffect = entity.Player.effect;
	const fields = [
		{
			name: JsonReader.commands.profile.getTranslation(language).information.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(language).information.fieldValue, {
				health: entity.health,
				maxHealth: await entity.getMaxHealth(),
				experience: entity.Player.experience,
				experienceNeededToLevelUp: entity.Player.getExperienceNeededToLevelUp(),
				money: entity.Player.money
			})
		},
		{
			name: JsonReader.commands.profile.getTranslation(language).statistique.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(language).statistique.fieldValue, {
				cumulativeAttack: await entity.getCumulativeAttack(
					await entity.Player.Inventory.getWeapon(),
					await entity.Player.Inventory.getArmor(),
					await entity.Player.Inventory.getPotion(),
					await entity.Player.Inventory.getActiveObject()
				),
				cumulativeDefense: await entity.getCumulativeDefense(await entity.Player.Inventory.getWeapon(),
					await entity.Player.Inventory.getArmor(),
					await entity.Player.Inventory.getPotion(),
					await entity.Player.Inventory.getActiveObject()
				),
				cumulativeSpeed: await entity.getCumulativeSpeed(
					await entity.Player.Inventory.getWeapon(),
					await entity.Player.Inventory.getArmor(),
					await entity.Player.Inventory.getPotion(),
					await entity.Player.Inventory.getActiveObject()
				),
				cumulativeHealth: await entity.getCumulativeHealth(),
				cumulativeMaxHealth: await entity.getMaxCumulativeHealth()
			})
		},
		{
			name: JsonReader.commands.profile.getTranslation(language).classement.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(
				language).classement.fieldValue, {
				rank: (await Players.getById(entity.Player.id))[0].rank,
				numberOfPlayer: await Players.count({
					where: {
						score: {
							[require("sequelize/lib/operators").gt]: 100
						}
					}
				}),
				score: entity.Player.score
			})
		}
	];

	if (!entity.Player.checkEffect()) {
		if (message.createdAt.getTime() >= entity.Player.effect_end_date) {
			titleEffect = ":hospital:";
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
				value: JsonReader.commands.profile.getTranslation(language).noTimeLeft.fieldValue
			});
		}
		else {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).timeLeft.fieldValue, {
					effect: entity.Player.effect,
					timeLeft: minutesToString(millisecondsToMinutes(entity.Player.effect_end_date - message.createdAt.getTime()))
				})
			});
		}
	}

	try {
		const playerClass = await Classes.getById(entity.Player.class);
		if (playerClass) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).playerClass.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).playerClass.fieldValue, {
					class: playerClass[language]
				}),
				inline: true
			});
		}
	}
	catch (error) {
		log("Error while getting class of player for profile: " + error);
	}

	try {
		const guild = await Guilds.getById(entity.Player.guild_id);
		if (guild) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).guild.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).guild.fieldValue, {
					guild: guild.name
				}),
				inline: true
			});
		}
	}
	catch (error) {
		log("Error while getting guild of player for profile: " + error);
	}

	try {
		const map_id = entity.Player.map_id;
		if (map_id !== null) {
			const map = await MapLocations.getById(map_id);
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).map.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).map.fieldValue, {
					mapEmote: map.getEmote(language),
					mapName: map["name_" + language]
				}),
				inline: true
			});
		}
	}
	catch (error) {
		console.log(error);
	}

	try {
		const pet = entity.Player.Pet;
		if (pet) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).pet.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).pet.fieldValue, {
					rarity: Pets.getRarityDisplay(pet.PetModel),
					emote: PetEntities.getPetEmote(pet),
					nickname: pet.nickname ? pet.nickname : PetEntities.getPetTypeName(pet, language)
				}),
				inline: false
			});
		}
	}
	catch (error) {
		console.log(error);
	}

	const msg = await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setTitle(format(JsonReader.commands.profile.getTranslation(language).title, {
				effect: titleEffect,
				pseudo: await entity.Player.getPseudo(language),
				level: entity.Player.level
			}))
			.addFields(fields)
	);

	const filterConfirm = (reaction) => reaction.me && !reaction.users.cache.last().bot;

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: JsonReader.commands.profile.badgeMaxReactNumber
	});

	collector.on("collect", (reaction) => {
		message.channel.send(JsonReader.commands.profile.getTranslation(language).badges[reaction.emoji.name]).then((msg) => {
			msg.delete({ "timeout": JsonReader.commands.profile.badgeDescriptionTimeout });
		});
	});

	if (entity.Player.badges !== null && entity.Player.badges !== "") {
		const badges = entity.Player.badges.split("-");
		for (const badgeid in badges) {
			if (Object.prototype.hasOwnProperty.call(badges, badgeid)) {
				await msg.react(badges[badgeid]);
			}
		}
	}
	if (new Date() - entity.Player.topggVoteAt < TOPGG.BADGE_DURATION * 60 * 60 * 1000) {
		await msg.react(TOPGG.BADGE);
	}
};

module.exports = {
	commands: [
		{
			name: "profile",
			func: ProfileCommand,
			aliases: ["p", "profil"]
		}
	]
};
