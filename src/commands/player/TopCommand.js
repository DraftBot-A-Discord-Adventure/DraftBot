/**
 * Allow to display the rankings of the players
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const topCommand = async function (language, message, args) {
      let entity;
      try {
        entity = await Entities.getByArgs(args, message);
      } catch (error) {
        [entity] = await Entities.getOrRegister(message.author.id);
      }
      // if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
      //     [EFFECT.BABY], entity)) !== true) {
      //   return;
      // }
      let badge;
      let pseudo;
      let embed = new discord.MessageEmbed();
      let actualPlayer = message.author.username;
      let test = (await Players.getById(entity.Player.id));
      let rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].rank;
      //top of the serv by a page number
      if (args[0] == "serv") { 
        let page = parseInt(args[1], 10);
        if (page == NaN)
          page = 1;
        let allPlayerOnServer = message.guild.members;
        let numberOfPlayerOnserver = allPlayerOnServer.cache.size;
        let pageMax = Math.ceil(numberOfPlayerOnserver / 15);
        if(pageMax<1)
          pageMax=1;
        let fin = page * 15;
        let debut = fin - 14;
      } 
      //top general of the week by a page number
      else if (args[0] == "week") { 
        let page = parseInt(args[1], 10);
        if (page == null) 
          page = 1;
        if(pageMax<1)
          pageMax=1;
        let fin = page * 15;
        let debut = fin - 14;
      } 
      //top general by a page number
      else { 
        let page = parseInt(args[0], 10);
        if (page == null)
          page = 1;
        let fin = page * 15;
        let debut = fin - 14;
        let numberOfPlayer = await Players.count({
          where: {
            score: {
              [(require('sequelize/lib/operators')).gt]: 100,
            },
          },
        });
        let pageMax = Math.ceil(numberOfPlayer / 15);
        if(pageMax<1)
            pageMax=1;
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
              // order: require('sequelize').literal('score DESC')
              order: [
                ['score', 'DESC'],
              ],
          }]});
        embed.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).general, { debut: debut, fin:  fin }));
        for(let k=debut; k<=numberOfPlayer; k++){
          pseudo = (await client.users.fetch(allEntities[k-1].discordUser_id)).username;
          if(k==1){badge = ":first_place:";}
          else if(k==2){badge = ":second_place:";}
          else if(k==3){badge = ":third_place:";}
          else if(k > 3 && k<= 5){badge = ":military_medal:";}
          if (message.author.id == allEntities[k-1].discordUser_id) {badge = ":white_circle:";}
          if (k>5 && message.guild.members.find(val => val.id === allEntities[k-1].discordUser_id) != null) {badge = ":blue_circle";}
          else {badge = ":black_circle";}
          embed.addField(format(JsonReader.commands.topCommand.getTranslation(language).fieldTitle, { badge : badge, rank: k, pseudo : pseudo}), format(JsonReader.commands.topCommand.getTranslation(language).fieldValue, { score: allEntities[k-1].Player.score, level:  allEntities[k-1].Player.level }), false)
        };
        if(rankCurrentPlayer==1){badge = ":first_place:";}
        else if(rankCurrentPlayer==2){badge = ":second_place:";}
        else if(rankCurrentPlayer==3){badge = ":third_place:";}
        else if(rankCurrentPlayer > 3 && rankCurrentPlayer<= 5){badge = ":military_medal:";}
        else if (message.author.id == message.author.id) {badge = ":white_circle:";}
        embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : numberOfPlayer}));
        return await message.channel.send(embed);
      }
}



      module.exports = {
        'top': topCommand,
      };