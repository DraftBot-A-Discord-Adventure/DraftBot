/**
 * Allow to display the rankings of the players
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const topWeekCommand = async function(language, message, args) {
	args.unshift("w");
	await topCommand(language, message, args);
};

const topServerCommand = function(language, message/* , args*/) {

	// TODO : Voir avec discord pourquoi le ts marche plus !
	// Morceau de code à retirer
	if (language === "fr") {
		return message.channel.send(":x: Cette commande est désactivée pour le moment suite à un changement de la part de discord dans leur API. Elle sera de retour bientôt !");
	}
	return message.channel.send(":x: This command is broken due to changes in the discord API, We hope to get it back online soon!");
	// fin du morceau de code à retirer

	// args.unshift("s");
	// await topCommand(language, message, args);
};

const topCommand = async function(language, message, args) {

	const [entity] = await Entities.getOrRegister(message.author.id);

	let rankCurrentPlayer = 0;

	let page = parseInt(args[args.length - 1]);
	if (page < 1) {
		page = 1;
	}
	if (isNaN(page)) {
		page = 1;
	}

	// top of the serv
	if (args[0] === "serv" || args[0] === "s") {

		if (entity.Player.score <= 100) {
			return await errorScoreTooLow(message, language);
		}

		// get all discordID on the server
		const listId = Array.from((await message.guild.members.fetch()).keys());

		rankCurrentPlayer = (await Entities.getServerRank(message.author.id, listId))[0].rank;

		const numberOfPlayer = await Entities.count({
			defaults: {
				Player: {
					Inventory: {}
				}
			},
			where: {
				discordUserId: listId
			},
			include: [{
				model: Players,
				as: "Player",
				where: {
					score: {
						[require("sequelize/lib/operators").gt]: 100
					}
				}
			}]
		});

		const allEntities = await Entities.findAll({
			defaults: {
				Player: {
					Inventory: {}
				}
			},
			where: {
				discordUserId: listId
			},
			include: [{
				model: Players,
				as: "Player",
				where: {
					score: {
						[require("sequelize/lib/operators").gt]: 100
					}
				}
			}],
			order: [
				[{model: Players, as: "Player"}, "score", "DESC"],
				[{model: Players, as: "Player"}, "level", "DESC"]
			],
			limit: 15,
			offset: (page - 1) * 15
		});

		await displayTop(message, language, numberOfPlayer, allEntities, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).server, page);
	}

	// top general of the week
	else if (args[0] === "week" || args[0] === "w") {

		if (entity.Player.weeklyScore <= 100) {
			return await errorScoreTooLow(message, language);
		}

		// rank of the user
		const rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].weeklyRank;
		const numberOfPlayer = await Players.count({
			where: {
				weeklyScore: {
					[require("sequelize/lib/operators").gt]: 100
				}
			}
		});
		const allEntities = await Entities.findAll({
			defaults: {
				Player: {
					Inventory: {}
				}
			},
			include: [{
				model: Players,
				as: "Player",
				where: {
					weeklyScore: {
						[require("sequelize/lib/operators").gt]: 100
					}
				}
			}],
			order: [
				[{model: Players, as: "Player"}, "weeklyScore", "DESC"],
				[{model: Players, as: "Player"}, "level", "DESC"]
			],
			limit: 15,
			offset: (page - 1) * 15
		});

		await displayTop(message, language, numberOfPlayer, allEntities, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).generalWeek, page);
	}

	// top general by a page number
	else {
		// rank of the user
		if (entity.Player.score <= 100) {
			return await errorScoreTooLow(message, language);
		}
		const rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].rank;

		const numberOfPlayer = await Players.count({
			where: {
				score: {
					[require("sequelize/lib/operators").gt]: 100
				}
			}
		});

		const allEntities = await Entities.findAll({
			defaults: {
				Player: {
					Inventory: {}
				}
			},
			include: [{
				model: Players,
				as: "Player",
				where: {
					score: {
						[require("sequelize/lib/operators").gt]: 100
					}
				}
			}],
			order: [
				[{model: Players, as: "Player"}, "score", "DESC"],
				[{model: Players, as: "Player"}, "level", "DESC"]
			],
			limit: 15,
			offset: (page - 1) * 15
		});

		await displayTop(message, language, numberOfPlayer, allEntities, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).general, page);
	}
};

/**
 * Send an error message saying that the score is too low
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @return {Promise<Message>}
 */
async function errorScoreTooLow(message, language) {
	return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.topCommand.getTranslation(language).lowScore);
}

/**
 * Sends a message with the top
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Number} numberOfPlayer
 * @param {*} allEntities
 * @param {string} actualPlayer
 * @param {Number} rankCurrentPlayer
 * @param {string} topTitle
 * @param {Number} page
 * @return {Promise<Message>}
 */

async function displayTop(message, language, numberOfPlayer, allEntities, rankCurrentPlayer, topTitle, page) { // eslint-disable-line max-params
	const embedError = new discord.MessageEmbed();
	const embed = new discord.MessageEmbed();
	const actualPlayer = message.author.username;
	let pageMax = Math.ceil(numberOfPlayer / 15);
	if (pageMax < 1) {
		pageMax = 1;
	}
	if (isNaN(page)) {
		page = 1;
	}
	if (page > pageMax || page < 1) {
		embedError.setColor(JsonReader.bot.embed.default)
			.setTitle(format(JsonReader.commands.topCommand.getTranslation(language).maxPageTitle, {
				pseudo: actualPlayer,
				pageMax: pageMax
			}))
			.setDescription(format(JsonReader.commands.topCommand.getTranslation(language).maxPageDesc, {pageMax: pageMax}));
		return await message.channel.send(embedError);
	}
	const fin = page * 15;
	const debut = fin - 14;
	let messages = "";
	let badge;
	// Indicate which top we are going to display
	embed.setColor(JsonReader.bot.embed.default)
		.setTitle(format(topTitle, {debut: debut, fin: fin}));
	// Build a string with 15 players informations
	for (let k = 0; k < allEntities.length; k++) {

		// pseudo of the current player being add to the string
		const pseudo = await allEntities[k].Player.getPseudo(language);
		let badgeState = ":smiley:";

		// badge depending on the rank
		if (page === 1) {
			if (k === 0) {
				badge = JsonReader.commands.topCommand.first;
			}
			else if (k === 1) {
				badge = JsonReader.commands.topCommand.second;
			}
			else if (k === 2) {
				badge = JsonReader.commands.topCommand.third;
			}
			else if (k > 2 && k <= 4) {
				badge = JsonReader.commands.topCommand.military;
			}
		}
		if (page !== 1 || k > 4) {
			if (message.guild.members.cache.find(val => val.id === allEntities[k].discordUserId) !== null) {
				badge = JsonReader.commands.topCommand.blue;
			}
			else {
				badge = JsonReader.commands.topCommand.black;
			}
		}
		if (message.author.id === allEntities[k].discordUserId) {
			badge = JsonReader.commands.topCommand.white;
		}

		// badgeState depending on last report
		// const nowMoment = new moment(new Date());
		// const lastReport = new moment(allEntities[k-1].Player.lastReportAt);
		// const diffMinutes = lastReport.diff(nowMoment, 'millisecondes');
		if (Date.now() < Date.parse(allEntities[k].Player.effectEndDate)) {
			badgeState = allEntities[k].Player.effect;
		}
		if (Date.now() > Date.parse(allEntities[k].Player.effectEndDate) + 2 * JsonReader.commands.topCommand.oneHour) {
			if (allEntities[k].Player.isInactive()) {
				badgeState = ":ghost:";
			}
			else {
				badgeState = ":newspaper2:";
			}
		}
		messages += format(JsonReader.commands.topCommand.getTranslation(language).playerRankLine, {
			badge: badge,
			rank: debut + k,
			pseudo: pseudo,
			badgeState: badgeState !== ":smiley:" ? badgeState + " | " : "",
			score: topTitle === JsonReader.commands.topCommand.getTranslation(language).generalWeek ? allEntities[k].Player.weeklyScore : allEntities[k].Player.score,
			level: allEntities[k].Player.level
		});
	}
	if (topTitle === JsonReader.commands.topCommand.getTranslation(language).generalWeek) {
		embed.setFooter(
			format(
				JsonReader.commands.topCommand.getTranslation(language).nextReset, {time: parseTimeDifference(new Date(), getNextSundayMidnight(), language)}
			), "https://i.imgur.com/OpL9WpR.png"
		);
	}
	embed.setDescription(messages);

	// Define badge for the user
	if (rankCurrentPlayer === 1) {
		badge = ":first_place:";
	}
	else if (rankCurrentPlayer === 2) {
		badge = ":second_place:";
	}
	else if (rankCurrentPlayer === 3) {
		badge = ":third_place:";
	}
	else if (rankCurrentPlayer > 3 && rankCurrentPlayer <= 5) {
		badge = ":military_medal:";
	}
	else {
		badge = ":black_circle:";
	}

	// test if user is in the current page displayed to indicate(or not) the page where he can find himself
	if ((rankCurrentPlayer > fin || rankCurrentPlayer < debut) && rankCurrentPlayer !== 1) {
		embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end1, {
			badge: badge,
			pseudo: actualPlayer,
			rank: rankCurrentPlayer,
			totalPlayer: numberOfPlayer,
			page: Math.ceil(rankCurrentPlayer / 15),
			pageMax: pageMax
		}));
	}
	else if ((rankCurrentPlayer > fin || rankCurrentPlayer < debut) && rankCurrentPlayer === 1) {
		embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end1Top, {
			pseudo: actualPlayer,
			rank: rankCurrentPlayer,
			totalPlayer: numberOfPlayer,
			page: Math.ceil(rankCurrentPlayer / 15),
			pageMax: pageMax
		}));
	}
	else if ((rankCurrentPlayer <= fin || rankCurrentPlayer >= debut) && rankCurrentPlayer !== 1) {
		embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end2, {
			badge: badge,
			pseudo: actualPlayer,
			rank: rankCurrentPlayer,
			totalPlayer: numberOfPlayer
		}));
	}
	else if ((rankCurrentPlayer <= fin || rankCurrentPlayer >= debut) && rankCurrentPlayer === 1) {
		embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end2Top, {
			pseudo: actualPlayer,
			rank: rankCurrentPlayer,
			totalPlayer: numberOfPlayer
		}));
	}

	return await message.channel.send(embed);
}

module.exports = {
	commands: [
		{
			name: "top",
			func: topCommand,
			aliases: ["t", "rank"]
		},
		{
			name: "topweek",
			func: topWeekCommand,
			aliases: ["topw", "tw"]
		},
		{
			name: "topserver",
			func: topServerCommand,
			aliases: ["topserv", "tops", "ts"]
		}
	]
};

module.exports.execute = (message, language, args) => {

};

module.exports.help = {
	name : ""
};