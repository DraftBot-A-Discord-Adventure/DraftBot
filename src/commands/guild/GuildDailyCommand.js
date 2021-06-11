const Maps = require("../../core/Maps");

module.exports.help = {
	name: "guilddaily",
	aliases: ["gdaily", "gd"]
};

/**
 * Allow to claim a daily guild reward
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {string|String} forcedReward
 */
const GuildDailyCommand = async (message, language, args, forcedReward) => {
	const translations = JsonReader.commands.guildDaily.getTranslation(language);
	let guild;
	const embed = new discord.MessageEmbed();

	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity, GUILD.REQUIRED_LEVEL) !== true) {
		return;
	}

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) { // not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			translations.notInAGuild);
	}

	const time = millisecondsToHours(message.createdAt.getTime() - guild.lastDailyAt.valueOf());
	if (time < JsonReader.commands.guildDaily.timeBetweenDailys && !forcedReward) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(translations.coolDown, {
				coolDownTime: JsonReader.commands.guildDaily.timeBetweenDailys,
				time: minutesToString(millisecondsToMinutes(JsonReader.commands.guildDaily.timeBetweenDailys * 3600000 - message.createdAt.getTime() + guild.lastDailyAt.valueOf()))
			}));
	}

	const members = await Entities.getByGuild(guild.id);

	for (const i in members) {
		if (hasBlockedPlayer(members[i].discordUserId) && getBlockedPlayer(members[i].discordUserId).context === "fight") {
			continue;
		}
		if (await sendBlockedError(await client.users.fetch(members[i].discordUserId), message.channel, language)) {
			return;
		}
	}

	guild.lastDailyAt = new Date(message.createdTimestamp);
	await guild.save();

	let rewardType = generateRandomProperty(guild);
	if (forcedReward) {
		rewardType = forcedReward;
	}

	embed.setTitle(format(translations.rewardTitle, {
		guildName: guild.name
	}));

	if (rewardType === REWARD_TYPES.PERSONAL_XP) {
		const xpWon = randInt(
			JsonReader.commands.guildDaily.minimalXp + guild.level,
			JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				members[i].Player.experience += xpWon;
				while (members[i].Player.needLevelUp()) {
					await members[i].Player.levelUpIfNeeded(members[i], message.channel, language);
				}
				await members[i].Player.save();
				await members[i].save();
			}
		}
		embed.setDescription(format(translations.personalXP, {
			xp: xpWon
		}));
		log("GuildDaily of guild " + guild.name + ": got " + xpWon + " personal xp");
	}

	if (rewardType === REWARD_TYPES.GUILD_XP) {
		const xpGuildWon = randInt(
			JsonReader.commands.guildDaily.minimalXp + guild.level,
			JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
		guild.experience += xpGuildWon;
		while (guild.needLevelUp()) {
			await guild.levelUpIfNeeded(message.channel, language);
		}
		await guild.save();
		embed.setDescription(format(translations.guildXP, {
			xp: xpGuildWon
		}));
		log("GuildDaily of guild " + guild.name + ": got " + xpGuildWon + " guild xp");
	}

	if (rewardType === REWARD_TYPES.MONEY) {
		const moneyWon = randInt(
			JsonReader.commands.guildDaily.minimalMoney + guild.level,
			JsonReader.commands.guildDaily.maximalMoney + guild.level * 4);
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				members[i].Player.addMoney(moneyWon);
				await members[i].Player.save();
			}
		}
		embed.setDescription(format(translations.money, {
			money: moneyWon
		}));
		log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " money");
	}

	if (rewardType === REWARD_TYPES.PET_FOOD) {
		if (guild.commonFood + JsonReader.commands.guildDaily.fixedPetFood > GUILD.MAX_COMMON_PET_FOOD) {
			rewardType = REWARD_TYPES.FIXED_MONEY;
		}
		else {
			guild.commonFood += JsonReader.commands.guildDaily.fixedPetFood;
			await Promise.all([guild.save()]);
			embed.setDescription(format(translations.petFood, {
				quantity: JsonReader.commands.guildDaily.fixedPetFood
			}));
		}

	}

	if (rewardType === REWARD_TYPES.FIXED_MONEY) {
		const moneyWon = JsonReader.commands.guildDaily.fixedMoney;
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				members[i].Player.addMoney(moneyWon);
				await members[i].Player.save();
			}
		}
		embed.setDescription(format(translations.money, {
			money: moneyWon
		}));
		log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " fixed money");
	}

	if (rewardType === REWARD_TYPES.BADGE) {
		let membersThatOwnTheBadge = 0;
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				if (!members[i].Player.addBadge("💎")) {
					membersThatOwnTheBadge++;
				}
				await members[i].Player.save();
			}
		}
		if (membersThatOwnTheBadge !== members.length) {
			embed.setDescription(translations.badge);
		}
		else {
			// everybody already have the badge, give something else instead
			rewardType = REWARD_TYPES.PARTIAL_HEAL;
		}
		log("GuildDaily of guild " + guild.name + ": got the badge");
	}

	if (rewardType === REWARD_TYPES.FULL_HEAL) {
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				if (members[i].Player.effect !== EFFECT.DEAD) {
					await members[i].addHealth(members[i].maxHealth);
				}
				await members[i].save();
			}
		}
		embed.setDescription(translations.fullHeal);
		log("GuildDaily of guild " + guild.name + ": got full heal");
	}

	if (rewardType === REWARD_TYPES.HOSPITAL) {
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				Maps.advanceTime(members[i].Player, Math.round(guild.level / 20) * 60);
				await members[i].Player.save();
			}
		}
		embed.setDescription(format(translations.hospital, {
			timeMoved: Math.round(guild.level / 20)
		}));
		log("GuildDaily of guild " + guild.name + ": got moved up");
	}

	if (rewardType === REWARD_TYPES.PARTIAL_HEAL) {
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				if (members[i].Player.effect !== EFFECT.DEAD) {
					await members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplier));
				}
				await members[i].save();
			}
		}
		embed.setDescription(format(translations.partialHeal, {
			healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplier)
		}));
		log("GuildDaily of guild " + guild.name + ": got partial heal");
	}

	if (rewardType === REWARD_TYPES.ALTERATION) {
		for (const i in members) {
			if (Object.prototype.hasOwnProperty.call(members, i)) {
				if (members[i].Player.currentEffectFinished()) {
					await members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplier));
					await members[i].save();
				}
				else if (members[i].Player.effect !== EFFECT.DEAD && members[i].Player.effect !== EFFECT.LOCKED) {
					await require("../../core/Maps").removeEffect(members[i].Player);
					await members[i].Player.save();
				}
			}
		}
		embed.setDescription(format(translations.alterationHeal, {
			healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplier)
		}));
		log("GuildDaily of guild " + guild.name + ": got alteration heal");
	}

	if (!Guilds.isPetShelterFull(guild) && draftbotRandom.realZeroToOneInclusive() <= 0.01) {
		const pet = await PetEntities.generateRandomPetEntity(guild.level);
		await pet.save();
		await (await GuildPets.addPet(guild.id, pet.id)).save();
		embed.setDescription(embed.description + "\n\n" + format(JsonReader.commands.guildDaily.getTranslation(language).pet, {
			emote: PetEntities.getPetEmote(pet),
			pet: PetEntities.getPetTypeName(pet, language)
		}));
		log("GuildDaily of guild " + guild.name + ": got pet: " + PetEntities.getPetEmote(pet) + " " + PetEntities.getPetTypeName(pet, "en"));
	}

	await message.channel.send(embed);

	for (const member of members) {
		const user = await client.users.fetch(member.discordUserId);
		if (member.Player.dmnotification && member.discordUserId !== message.author.id) {
			sendDirectMessage(
				user,
				JsonReader.commands.guildDaily.getTranslation(language).dmNotification.title,
				format(
					JsonReader.commands.guildDaily.getTranslation(language).dmNotification.description,
					{
						serveur: message.guild.name,
						pseudo: message.author.username
					}
				) + embed.description,
				JsonReader.bot.embed.default,
				language
			);
		}
	}
};

function generateRandomProperty(guild) {
	let resultNumber = randInt(0, 1000);
	const rewardLevel = Math.floor(guild.level / 10);
	const recompenses = JsonReader.commands.guildDaily.guildChances[rewardLevel];
	for (const property in recompenses) {
		if (Object.prototype.hasOwnProperty.call(recompenses, property)) {
			if (recompenses[property] < resultNumber) {
				resultNumber -= recompenses[property];
			}
			else {
				return property;
			}
		}
	}
}

module.exports.execute = GuildDailyCommand;