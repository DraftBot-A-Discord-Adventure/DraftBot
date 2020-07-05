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
      let badgeState;
      let pseudo;

      //embed message
      let embedError = new discord.MessageEmbed();
      let embed = new discord.MessageEmbed();
      
      //Command sender username
      let actualPlayer = message.author.username;


      //top of the serv
      if (args[0] == "serv") {
        //rank of the user
        let rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].rank;

        //get all discordID on the server and get the entities order DESC on score
        let listId = Array.from((await message.guild.members.fetch()).keys())
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
            [{ model: Players, as: 'Player' }, 'score', 'DESC']
          ],
        });
        
        //Get the number of player and define the number of page
        let numberOfPlayer = (await message.guild.members.fetch()).size;
        let pageMax = Math.ceil(allEntities.length / 15);
        if(pageMax<1)
          pageMax=1;
        let page = parseInt(args[1], 10);
        if (isNaN(page))
          page = 1;
        if(page > pageMax || page < 1){
          embedError.setColor(JsonReader.bot.embed.default)
          .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).maxPage, {pseudo: actualPlayer, pageMax:pageMax}));
          return await message.channel.send(embedError);
        }
        let fin = page * 15;
        let debut = fin - 14;
        let messages=""
        //Indicate which top we are going to display
        embed.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).server, {debut: debut, fin:fin}));
        //Build a string with 15 players informations
        for(let k=allEntities.length; k>=debut; k--){
          //pseudo of the current player being add to the string
          pseudo = (await client.users.fetch(allEntities[k-1].discordUser_id)).username;

          //badge depending on the rank
          if(k==allEntities.length){badge = ":first_place:";}
          else if(k==allEntities.length-1){badge = ":second_place:";}
          else if(k==allEntities.length-2){badge = ":third_place:";}
          else if(k < allEntities.length-2 && k>= allEntities.length-4){badge = ":military_medal:";}
          if (message.author.id == allEntities[k-1].discordUser_id) {badge = ":white_circle:";}
          if (k<allEntities.length-4){badge = ":black_circle:";}

          //badgeState depending on last report
          if(((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))<3600000) || allEntities[k-1].Player.lastReportAt==null){badgeState=allEntities[k-1].effect}
          if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>3600000){
            if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>1296000000){
              badgeState=":ghost:"
            }
            else{badgeState=":newspaper2:"}
          }
          messages +=badge+" "+(allEntities.length-k+1)+" **"+pseudo+"** | "+badgeState+" | `"+allEntities[k-1].Player.score+"` | `"+allEntities[k-1].Player.level+"`\n";
          embed.setDescription(messages);
        };

        //Define badge for the user
        if(rankCurrentPlayer==1){badge = ":first_place:";}
        else if(rankCurrentPlayer==2){badge = ":second_place:";}
        else if(rankCurrentPlayer==3){badge = ":third_place:";}
        else if(rankCurrentPlayer > 3 && rankCurrentPlayer<= 5){badge = ":military_medal:";}
        else {badge = ":black_circle:";}

        //test if user is in the current page displayed to indicate(or not) the page where he can find himself
        if(rankCurrentPlayer > fin || rankCurrentPlayer < debut){
          embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end1, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : allEntities.length, page:Math.ceil(rankCurrentPlayer/15)}));
        }
        embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end2, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : allEntities.length}));
        return await message.channel.send(embed);
      }


      //top general of the week
      else if (args[0] == "week") {
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
          }]
        });
        let pageMax = Math.ceil(numberOfPlayer / 15);
        if(pageMax<1)
            pageMax=1;
        let page = parseInt(args[1], 10);
        if (isNaN(page))
          page = 1;
        if(page > pageMax || page < 1){
          embedError.setColor(JsonReader.bot.embed.default)
          .setDescription(format(JsonReader.commands.topCommand.getTranslation(language).maxPage, {pseudo: actualPlayer, pageMax : pageMax}));
          return await message.channel.send(embedError);
        }
        let fin = page * 15;
        let debut = fin - 14;
        let messages=""
        embed.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).generalWeek, {    debut: debut, fin:  fin }));
        for(let k=numberOfPlayer; k>=debut; k--){
          //pseudo of the current player being add to the string
          pseudo = (await client.users.fetch(allEntities[k-1].discordUser_id)).username;

          //badge depending on the rank
          if(k==numberOfPlayer){badge = ":first_place:";}
          else if(k==numberOfPlayer-1){badge = ":second_place:";}
          else if(k==numberOfPlayer-2){badge = ":third_place:";}
          else if(k < numberOfPlayer-2 && k>= numberOfPlayer-4){badge = ":military_medal:";}
          if (message.author.id == allEntities[k-1].discordUser_id) {badge = ":white_circle:";}
          if (k<numberOfPlayer-4){
            if(message.guild.members.find(val => val.id === allEntities[k].discordUser_id) != null) {badge = ":blue_circle:";}
            else {badge = ":black_circle:";}
          }

          //badgeState depending on last report
          if(((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))<3600000) || allEntities[k-1].Player.lastReportAt==null){badgeState=allEntities[k-1].effect}
          if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>3600000){
            if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>1296000000){
              badgeState=":ghost:"
            }
            else{badgeState=":newspaper2:"}
          }
          messages +=badge+" "+(numberOfPlayer-k+1)+" **"+pseudo+"** | "+badgeState+" | `"+allEntities[k-1].Player.weeklyScore+"` | `"+allEntities[k-1].Player.level+"`\n";
          embed.setDescription(messages);
          
          
        };
        //Define badge for the user
        if(rankCurrentPlayer==1){badge = ":first_place:";}
        else if(rankCurrentPlayer==2){badge = ":second_place:";}
        else if(rankCurrentPlayer==3){badge = ":third_place:";}
        else if(rankCurrentPlayer > 3 && rankCurrentPlayer<= 5){badge = ":military_medal:";}
        else if (message.author.id == message.author.id) {badge = ":white_circle:";}

        //test if user is in the current page displayed to indicate(or not) the page where he can find himself
        if(rankCurrentPlayer > fin || rankCurrentPlayer < debut)
          embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end1, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : numberOfPlayer, page:Math.ceil(rankCurrentPlayer/15)}));
        embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end2, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : numberOfPlayer}));
        return await message.channel.send(embed);
      } 



      //top general by a page number
      else { 
        //rank of the user
        let rankCurrentPlayer = (await Players.getById(entity.Player.id))[0].rank;
        let page = parseInt(args[0], 10);
        if (isNaN(page))
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
        });
        let pageMax = Math.ceil(numberOfPlayer / 15);
        if(pageMax<1)
            pageMax=1;
        if(page > pageMax || page < 1){
          embedError.setColor(JsonReader.bot.embed.default)
          .setDescription(format(JsonReader.commands.topCommand.getTranslation(language).maxPage, {pseudo: actualPlayer, pageMax : pageMax}));
          return await message.channel.send(embedError);
        }
        let messages=""
        embed.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.topCommand.getTranslation(language).general, {    debut: debut, fin:  fin }));
        for(let k=numberOfPlayer; k>=debut; k--){
          //pseudo of the current player being add to the string
          pseudo = (await client.users.fetch(allEntities[k-1].discordUser_id)).username;

          //badge depending on the rank
          if(k==numberOfPlayer){badge = ":first_place:";}
          else if(k==numberOfPlayer-1){badge = ":second_place:";}
          else if(k==numberOfPlayer-2){badge = ":third_place:";}
          else if(k < numberOfPlayer-2 && k>= numberOfPlayer-4){badge = ":military_medal:";}
          if (message.author.id == allEntities[k-1].discordUser_id) {badge = ":white_circle:";}
          if (k<numberOfPlayer-4){
            if(message.guild.members.find(val => val.id === allEntities[k].discordUser_id) != null) {badge = ":blue_circle:";}
            else {badge = ":black_circle:";}
          }

          //badgeState depending on last report
          if(((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))<3600000) || allEntities[k-1].Player.lastReportAt==null){badgeState=allEntities[k-1].effect}
          if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>3600000){
            if((Date.now()-Date.parse(allEntities[k-1].Player.lastReportAt))>1296000000){
              badgeState=":ghost:"
            }
            else{badgeState=":newspaper2:"}
          }
          messages +=badge+" "+(numberOfPlayer-k+1)+" **"+pseudo+"** | "+badgeState+" | `"+allEntities[k-1].Player.score+"` | `"+allEntities[k-1].Player.level+"`\n";
          embed.setDescription(messages);
          
          
        };
        //Define badge for the user
        if(rankCurrentPlayer==1){badge = ":first_place:";}
        else if(rankCurrentPlayer==2){badge = ":second_place:";}
        else if(rankCurrentPlayer==3){badge = ":third_place:";}
        else if(rankCurrentPlayer > 3 && rankCurrentPlayer<= 5){badge = ":military_medal:";}
        else if (message.author.id == message.author.id) {badge = ":white_circle:";}

        //test if user is in the current page displayed to indicate(or not) the page where he can find himself
        if(rankCurrentPlayer > fin || rankCurrentPlayer < debut)
          embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end1, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : numberOfPlayer, page:Math.ceil(rankCurrentPlayer/15)}));
        embed.addField("Votre classement", format(JsonReader.commands.topCommand.getTranslation(language).end2, { badge : badge, pseudo : actualPlayer, rank: rankCurrentPlayer, totalPlayer : numberOfPlayer}));
        return await message.channel.send(embed);
      }
}



      module.exports = {
        'top': topCommand,
      };