/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
  let entity = await Entities.getByArgs(args, message);
  if (entity === null) {
    [entity] = await Entities.getOrRegister(message.author.id);
  }

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
      [EFFECT.BABY], entity)) !== true) {
    return;
  }

  let titleEffect = entity.effect;
  const fields = [
    {
      name: JsonReader.commands.profile.getTranslation(language).information.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(language).information.fieldValue, {
        health: entity.health,
        maxHealth: entity.maxHealth,
        experience: entity.Player.experience,
        experienceNeededToLevelUp: entity.Player.getExperienceNeededToLevelUp(),
        money: entity.Player.money,
      }),
    },
    {
      name: JsonReader.commands.profile.getTranslation(language).statistique.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(language).statistique.fieldValue, {
        cumulativeAttack: entity.getCumulativeAttack(
            await entity.Player.Inventory.getWeapon(),
            await entity.Player.Inventory.getArmor(),
            await entity.Player.Inventory.getPotion(),
            await entity.Player.Inventory.getActiveObject(),
        ),
        cumulativeDefense: entity.getCumulativeDefense(await entity.Player.Inventory.getWeapon(),
            await entity.Player.Inventory.getArmor(),
            await entity.Player.Inventory.getPotion(),
            await entity.Player.Inventory.getActiveObject(),
        ),
        cumulativeSpeed: entity.getCumulativeSpeed(
            await entity.Player.Inventory.getWeapon(),
            await entity.Player.Inventory.getArmor(),
            await entity.Player.Inventory.getPotion(),
            await entity.Player.Inventory.getActiveObject(),
        ),
        cumulativeMaxHealth: entity.getCumulativeHealth(entity.Player),
      }),
    },
    {
      name: JsonReader.commands.profile.getTranslation(language).classement.fieldName,
      value: format(JsonReader.commands.profile.getTranslation(
          language).classement.fieldValue, {
        rank: (await Players.getById(entity.Player.id))[0].rank,
        numberOfPlayer: (await Players.count({
          where: {
            score: {
              [(require('sequelize/lib/operators')).gt]: 100,
            },
          },
        })),
        score: entity.Player.score,
      }),
    },
  ];

  if (!entity.checkEffect()) {
    if (message.createdAt.getTime() >= entity.Player.lastReportAt.getTime()) {
      titleEffect = ':hospital:';
      fields.push({
        name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
        value: JsonReader.commands.profile.getTranslation(language).noTimeLeft.fieldValue,
      });
    } else {
      fields.push({
        name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
        value: format(JsonReader.commands.profile.getTranslation(language).timeLeft.fieldValue, {
          effect: entity.effect,
          timeLeft: minutesToString(millisecondsToMinutes(entity.Player.lastReportAt.getTime() - message.createdAt.getTime())),
        }),
      });
    }
  }

  const msg = await message.channel.send(
      new discord.MessageEmbed()
          .setColor(JsonReader.bot.embed.default)
          .setTitle(format(JsonReader.commands.profile.getTranslation(language).title, {
            effect: titleEffect,
            pseudo: (await entity.Player.getPseudo(language)),
            level: entity.Player.level,
          }))
          .addFields(fields),
  );

  const filterConfirm = (reaction, user) => {
    return (reaction.me && !reaction.users.cache.last().bot);
  };

  const collector = msg.createReactionCollector(filterConfirm, {
    time: 120000,
    max: JsonReader.commands.profile.badgeMaxReactNumber,
  });

  collector.on('collect', async (reaction) => {
    message.channel.send(JsonReader.commands.profile.getTranslation(language).badges[reaction.emoji.name]).then((msg) => {
      msg.delete({'timeout': JsonReader.commands.profile.badgeDescriptionTimeout});
    }).catch((err) => { });
  });

  if (entity.Player.badges !== null) {
    const badges = entity.Player.badges.split('-');
    for (const badgeid in badges) {
      await msg.react(badges[badgeid]);
    }
  }
};

module.exports = {
  'profile': ProfileCommand,
  'p': ProfileCommand,
};
