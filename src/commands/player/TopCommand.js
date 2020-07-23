const moment = require('moment');

/**
 * Allow to display the rankings of the players
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const topWeekCommand = async function (language, message, args) {
  args.unshift("w");
  await topCommand(language, message, args);
};

const topServerCommand = async function (language, message, args) {
  args.unshift("s");
  await topCommand(language, message, args);
};

const topCommand = async function (language, message, args) {

      const [entity] = await Entities.getOrRegister(message.author.id);

      const actualPlayer = message.author.username;
      let rankCurrentPlayer = 0;

      //top of the serv
      if (args[0] === "serv" || args[0] === "s") {

        if (entity.Player.score < 100) {
          return await errorScoreTooLow(message, language);
        }

        //get all discordID on the server and get the entities order DESC on score
        let listId = Array.from((await message.guild.members.fetch()).keys());
        let allEntities = await Entities.findAll({
          defaults: {
            Player: {
              Inventory: {}
            }
          },
          where: {
            discordUser_id: listId
          },
          include: [{
            model: Players,
            as: 'Player',
            where: {
              score: {
                [(require('sequelize/lib/operators')).gt]: 100,
              },
            },
          }],
          order: [
            [{model: Players, as: 'Player'}, 'score', 'DESC'],
            [{model: Players, as: 'Player'}, 'level', 'DESC']
          ]
        });

        for (let i = 0; i < allEntities.length; i++) {
          if (message.author.id === allEntities[i].discordUser_id) {
            rankCurrentPlayer = i + 1;
          }
        }

        await displayTop(message, language, allEntities.length, allEntities, actualPlayer, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).server, parseInt(args[1]));
      }

      //top general of the week
      else if (args[0] === "week" || args[0] === "w") {

        if (entity.Player.weeklyScore < 100) {
          return await errorScoreTooLow(message, language);
        }

        //rank of the user
        let rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].weeklyRank;
        let numberOfPlayer = await Players.count({
          where: {
            weeklyScore: {
              [(require('sequelize/lib/operators')).gt]: 100,
            },
          },
        });
        let allEntities = await Entities.findAll({
          defaults: {
            Player: {
              Inventory: {}
            }
          },
          include: [{
            model: Players,
            as: 'Player',
            where: {
              weeklyScore: {
                [(require('sequelize/lib/operators')).gt]: 100,
              },
            },
          }],
          order: [
            [{model: Players, as: 'Player'}, 'weeklyScore', 'DESC'],
            [{model: Players, as: 'Player'}, 'level', 'DESC']
          ]
        });

        await displayTop(message, language, numberOfPlayer, allEntities, actualPlayer, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).generalWeek, parseInt(args[1]));
      }

      //top general by a page number
      else {
        //rank of the user
        if (entity.Player.score < 100) {
          return await errorScoreTooLow(message, language);
        }
        let rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].rank;
        let numberOfPlayer = await Players.count({
          where: {
            score: {
              [(require('sequelize/lib/operators')).gt]: 100,
            },
          },
        });
        let allEntities = await Entities.findAll({
          defaults: {
            Player: {
              Inventory: {}
            }
          },
          include: [{
            model: Players,
            as: 'Player',
            where: {
              score: {
                [(require('sequelize/lib/operators')).gt]: 100,
              },
            },
          }],
          order: [
            [{model: Players, as: 'Player'}, 'score', 'DESC'],
            [{model: Players, as: 'Player'}, 'level', 'DESC']
          ]
        });

        await displayTop(message, language, numberOfPlayer, allEntities, actualPlayer, rankCurrentPlayer, JsonReader.commands.topCommand.getTranslation(language).general, parseInt(args[0]));
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
 * @param {Number} allEntities
 * @param {string} actualPlayer
 * @param {Number} rankCurrentPlayer
 * @param {string} topTitle
 * @param {Number} page
 * @return {Promise<Message>}
 */
async function displayTop(message, language, numberOfPlayer, allEntities, actualPlayer, rankCurrentPlayer, topTitle, page) {
  let embedError = new discord.MessageEmbed();
  let embed = new discord.MessageEmbed();
  let pageMax = Math.ceil(allEntities.length / 15);
  if (pageMax < 1)
    pageMax = 1;
  if (isNaN(page))
    page = 1;
  if (page > pageMax || page < 1) {
    embedError.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).maxPageTitle, {
          pseudo: actualPlayer,
          pageMax: pageMax
        }))
        .setDescription(format(JsonReader.commands.topCommand.getTranslation(language).maxPageDesc, {pageMax: pageMax}));
    return await message.channel.send(embedError);
  }
  let fin = page * 15;
  let debut = fin - 14;
  let messages = "";
  let badge;
  //Indicate which top we are going to display
  embed.setColor(JsonReader.bot.embed.default)
      .setTitle(format(topTitle, {debut: debut, fin: fin}));
  //Build a string with 15 players informations
  for (let k = debut; k <= fin; k++) {
    if (k - 1 < allEntities.length) {
      //pseudo of the current player being add to the string
      let pseudo = await allEntities[k - 1].Player.getPseudo(language);
      let badgeState;

      //badge depending on the rank
      if (k === 1) badge = JsonReader.commands.topCommand.first;
      else if (k === 2) badge = JsonReader.commands.topCommand.second;
      else if (k === 3) badge = JsonReader.commands.topCommand.third;
      else if (k > 3 && k <= 5) badge = JsonReader.commands.topCommand.military;
      else if (k > 5) {
        if (message.guild.members.cache.find(val => val.id === allEntities[k - 1].discordUser_id) != null) badge = JsonReader.commands.topCommand.blue;
        else badge = JsonReader.commands.topCommand.black;
      }
      if (message.author.id === allEntities[k - 1].discordUser_id) badge = JsonReader.commands.topCommand.white;

      //badgeState depending on last report
      // const nowMoment = new moment(new Date());
      // const lastReport = new moment(allEntities[k-1].Player.lastReportAt);
      // const diffMinutes = lastReport.diff(nowMoment, 'millisecondes');
      if (((Date.now() - Date.parse(allEntities[k - 1].Player.lastReportAt)) < JsonReader.commands.topCommand.oneHour) || allEntities[k - 1].Player.lastReportAt == null) badgeState = allEntities[k - 1].effect;
      if ((Date.now() - Date.parse(allEntities[k - 1].Player.lastReportAt)) > JsonReader.commands.topCommand.oneHour) {
        if ((Date.now() - Date.parse(allEntities[k - 1].Player.lastReportAt)) > JsonReader.commands.topCommand.fifth10days) {
          badgeState = ":ghost:"
        } else {
          badgeState = ":newspaper2:"
        }
      }
      messages += format(JsonReader.commands.topCommand.getTranslation(language).playerRankLine, {
        badge: badge,
        rank: k,
        pseudo: pseudo,
        badgeState: badgeState !== ":smiley:" ? badgeState + " | " : "",
        score: topTitle === JsonReader.commands.topCommand.getTranslation(language).generalWeek ? allEntities[k - 1].Player.weeklyScore : allEntities[k - 1].Player.score,
        level: allEntities[k - 1].Player.level
      });
      if (topTitle === JsonReader.commands.topCommand.getTranslation(language).generalWeek) {
        embed.setFooter(format(JsonReader.commands.topCommand.getTranslation(language).nextReset, { time: parseTimeDifference(new Date(), getNextSundayMidnight(), language) }),'https://i.imgur.com/OpL9WpR.png');
      }
      embed.setDescription(messages);
    }
  }

  //Define badge for the user
  if (rankCurrentPlayer === 1) badge = ":first_place:";
  else if (rankCurrentPlayer === 2) badge = ":second_place:";
  else if (rankCurrentPlayer === 3) badge = ":third_place:";
  else if (rankCurrentPlayer > 3 && rankCurrentPlayer <= 5) badge = ":military_medal:";
  else if (message.author.id === message.author.id) badge = ":black_circle:";

  //test if user is in the current page displayed to indicate(or not) the page where he can find himself
  if ((rankCurrentPlayer > fin || rankCurrentPlayer < debut) && rankCurrentPlayer !== 1) {
    embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end1, {
      badge: badge,
      pseudo: actualPlayer,
      rank: rankCurrentPlayer,
      totalPlayer: numberOfPlayer,
      page: Math.ceil(rankCurrentPlayer / 15),
      pageMax: pageMax
    }));
  } else if ((rankCurrentPlayer > fin || rankCurrentPlayer < debut) && rankCurrentPlayer === 1) {
    embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end1Top, {
      pseudo: actualPlayer,
      rank: rankCurrentPlayer,
      totalPlayer: numberOfPlayer,
      page: Math.ceil(rankCurrentPlayer / 15),
      pageMax: pageMax
    }));
  } else if ((rankCurrentPlayer <= fin || rankCurrentPlayer >= debut) && rankCurrentPlayer !== 1) {
    embed.addField(JsonReader.commands.topCommand.getTranslation(language).yourRanking, format(JsonReader.commands.topCommand.getTranslation(language).end2, {
      badge: badge,
      pseudo: actualPlayer,
      rank: rankCurrentPlayer,
      totalPlayer: numberOfPlayer
    }));
  } else if ((rankCurrentPlayer <= fin || rankCurrentPlayer >= debut) && rankCurrentPlayer === 1) {
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
      name: 'top',
      func: topCommand
    },
    {
      name: 'topweek',
      func: topWeekCommand,
      aliases: ['topw', 'tw']
    },
    {
      name: 'topserver',
      func: topServerCommand,
      aliases: ['topserv', 'tops', 'ts']
    }
  ]
};