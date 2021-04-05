/**
 * Allow to claim a daily guild reward
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildDailyCommand = async (language, message, args, forcedReward) => {
	const translations = JsonReader.commands.guildDaily.getTranslation(language);
	let entity;
	let guild;
	const embed = new discord.MessageEmbed();

	[entity] = await Entities.getOrRegister(message.author.id);

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity, GUILD.REQUIRED_LEVEL)) !== true) {
		return;
	}

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guild_id);
	} catch (error) {
		guild = null;
	}

	if (guild === null) { // not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			translations.notInAGuild);
	}

	let time = millisecondsToHours(message.createdAt.getTime() - guild.lastDailyAt.valueOf());
	if (time < JsonReader.commands.guildDaily.timeBetweenDailys && !forcedReward) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(translations.coolDown, {
				coolDownTime: JsonReader.commands.guildDaily.timeBetweenDailys,
				time: minutesToString(millisecondsToMinutes(JsonReader.commands.guildDaily.timeBetweenDailys * 3600000 - message.createdAt.getTime() + guild.lastDailyAt.valueOf())),
			}));
	}

	const members = await Entities.getByGuild(guild.id);

	for (const i in members) {
		if (hasBlockedPlayer(members[i].discordUser_id) && getBlockedPlayer(members[i].discordUser_id).context === "fight") {
			continue;
		}
		if (await sendBlockedError(await client.users.fetch(members[i].discordUser_id), message.channel, language)) {
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
		guildName: guild.name,
	}));

	if (rewardType === REWARD_TYPES.PERSONAL_XP) {
		const xpWon = randInt(
			JsonReader.commands.guildDaily.minimalXp + guild.level,
			JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
		for (const i in members) {
			members[i].Player.experience += xpWon;
			while (members[i].Player.needLevelUp()) {
				await members[i].Player.levelUpIfNeeded(members[i], message.channel, language);
			}
			await members[i].Player.save();
			await members[i].save();
		}
		embed.setDescription(format(translations.personalXP, {
			xp: xpWon,
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
			xp: xpGuildWon,
		}));
		log("GuildDaily of guild " + guild.name + ": got " + xpGuildWon + " guild xp");
	}

	if (rewardType === REWARD_TYPES.MONEY) {
		const moneyWon = randInt(
			JsonReader.commands.guildDaily.minimalMoney + guild.level,
			JsonReader.commands.guildDaily.maximalMoney + guild.level * 4);
		for (const i in members) {
			members[i].Player.addMoney(moneyWon);
			await members[i].Player.save();
		}
		embed.setDescription(format(translations.money, {
			money: moneyWon,
		}));
		log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " money");
	}

	if (rewardType === REWARD_TYPES.PET_FOOD) {
		if (guild["commonFood"] + JsonReader.commands.guildDaily.fixedPetFood > GUILD.MAX_COMMON_PET_FOOD) {
			rewardType = REWARD_TYPES.FIXED_MONEY;
		} else {
			guild["commonFood"] = guild["commonFood"] + JsonReader.commands.guildDaily.fixedPetFood;
			Promise.all([guild.save()]);
			embed.setDescription(format(translations.petFood, {
				quantity: JsonReader.commands.guildDaily.fixedPetFood
			}));
		}

	}

	if (rewardType === REWARD_TYPES.FIXED_MONEY) {
		const moneyWon = JsonReader.commands.guildDaily.fixedMoney;
		for (const i in members) {
			members[i].Player.addMoney(moneyWon);
			await members[i].Player.save();
		}
		embed.setDescription(format(translations.money, {
			money: moneyWon,
		}));
		log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " fixed money");
	}

	if (rewardType === REWARD_TYPES.BADGE) {
		let membersThatOwnTheBadge = 0;
		for (const i in members) {
			if (!members[i].Player.addBadge('💎')) {
				membersThatOwnTheBadge++;
			}
			await members[i].Player.save();
		}
		if (membersThatOwnTheBadge !== members.length) {
			embed.setDescription(translations.badge);
		} else {
			// everybody already have the badge, give something else instead
			rewardType = REWARD_TYPES.PARTIAL_HEAL;
		}
		log("GuildDaily of guild " + guild.name + ": got the badge");
	}

	if (rewardType === REWARD_TYPES.FULL_HEAL) {
		for (const i in members) {
			if (members[i].effect != EFFECT.DEAD) {
				await members[i].addHealth(members[i].maxHealth);
			}
			await members[i].save();
		}
		embed.setDescription(translations.fullHeal);
		log("GuildDaily of guild " + guild.name + ": got full heal");
	}

	if (rewardType === REWARD_TYPES.HOSPITAL) {
		for (const i in members) {
			await members[i].Player.fastForward(Math.round(guild.level / 20))

			await members[i].Player.save();
		}
		embed.setDescription(format(translations.hospital, {
			timeMoved: Math.round(guild.level / 20),
		}));
		log("GuildDaily of guild " + guild.name + ": got moved up");
	}

	if (rewardType === REWARD_TYPES.PARTIAL_HEAL) {
		for (const i in members) {
			if (members[i].effect != EFFECT.DEAD) {
				await members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
			}
			await members[i].save();
		}
		embed.setDescription(format(translations.partialHeal, {
			healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer),
		}));
		log("GuildDaily of guild " + guild.name + ": got partial heal");
	}

	if (rewardType === REWARD_TYPES.ALTERATION) {
		for (const i in members) {
			if (members[i].currentEffectFinished()) {
				await members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
			} else if (members[i].effect !== EFFECT.DEAD && members[i].effect !== EFFECT.LOCKED) {
				members[i].effect = EFFECT.SMILEY;
				members[i].Player.lastReportAt = new Date(message.createdTimestamp);
			}
			await members[i].Player.save();
			await members[i].save();
		}
		embed.setDescription(format(translations.alterationHeal, {
			healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer),
		}));
		log("GuildDaily of guild " + guild.name + ": got alteration heal");
	}

	if (!Guilds.isPetShelterFull(guild) && draftbotRandom.realZeroToOneInclusive() <= 0.01) {
		let pet = await PetEntities.generateRandomPetEntity(guild.level);
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
		let user = await client.users.fetch(member.discordUser_id);
		if (member.Player.dmnotification && member.discordUser_id != message.author.id) {
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

module.exports = {
	commands: [
		{
			name: 'guilddaily',
			func: GuildDailyCommand,
			aliases: ['gdaily', 'gd']
		}
	]
};


/**
 * update the moment where the daily guild was used
 * @param {*} guild
 * @param {*} message
 */
function updateLastInvocation(guild, message) {
	guild.lastInvocation = message.createdTimestamp;
}

function generateRandomProperty(guild) {
	let resultNumber = randInt(0, 1000);
	const rewardLevel = Math.floor(guild.level / 10);
	const recompenses = JsonReader.commands.guildDaily.guildChances[rewardLevel];
	for (const property in recompenses) {
		if (recompenses[property] < resultNumber) {
			resultNumber -= recompenses[property];
		} else {
			return property;
		}
	}
}

