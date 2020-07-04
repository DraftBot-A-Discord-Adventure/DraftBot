/**
 * Convert a discord id into a discord mention
 * @param {*} id - The role/user id
 */
global.idToMention = (id) => {
  return '<@&' + id + '>';
};

/**
 * Send all attachments from a message to a discord channel
 * @param {module:"discord.js".Message} message - Message from the discord user
 * @param {module:"discord.js".TextChannel} channel - The channel where all attachments will be sent
 */
global.sendMessageAttachments = (message, channel) => {
  message.attachments.forEach(element => {
    channel.send({
      files: [{
        attachment: element.url,
        name: element.filename
      }]
    });
  });
};

/**
 * Send an error in a channel
 * @param {module:"discord.js".User} user 
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String} reason
 */
global.sendErrorMessage = (user, channel, language, reason) => {
  let embed = new discord.MessageEmbed();
  embed.setColor(JsonReader.bot.embed.error)
    .setAuthor(format(JsonReader.error.getTranslation(language).title, {
      pseudo: user.username
    }), user.displayAvatarURL())
    .setDescription(reason);
  return channel.send(embed);
};

/**
 * give a random item
 * @param {module:"discord.js".User} discordUser 
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entity} entity
 */
global.giveRandomItem = async (discordUser, channel, language, entity) => {
  let item = await entity.Player.Inventory.generateRandomItem();
  let embed = new discord.MessageEmbed();
  embed.setAuthor(format(JsonReader.commands.inventory.getTranslation(language).randomItemTitle, {
    pseudo: discordUser.username
  }), discordUser.displayAvatarURL())
    .setDescription(item.toString(language));
  if (item instanceof Potions) {
    let potion = await entity.Player.Inventory.getPotion();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: potion.toString(language)
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: potion.toString(language)
    }));
  }
  if (item instanceof Objects) {
    let object = await entity.Player.Inventory.getBackupObject();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: object.toString(language)
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: object.toString(language)
    }));
  }
  if (item instanceof Weapons) {
    let weapon = await entity.Player.Inventory.getWeapon();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: weapon.toString(language)
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: weapon.toString(language)
    }));
  }
  if (item instanceof Armors) {
    let armor = await entity.Player.Inventory.getArmor();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: armor.toString(language)
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: armor.toString(language)
    }));
  }

  let msg = await channel.send(embed);
  const filterConfirm = (reaction, user) => {
    return ((reaction.emoji.name == MENU_REACTION.ACCEPT || reaction.emoji.name == MENU_REACTION.DENY) && user.id === discordUser.id);
  };

  const collector = msg.createReactionCollector(filterConfirm, {
    time: 120000,
    max: 1
  });

  collector.on('end', async (reaction) => {

    if (reaction.first()) { // a reaction exist
      if (reaction.first().emoji.name == MENU_REACTION.ACCEPT) {
        embed = new discord.MessageEmbed();
        embed.setAuthor(format(JsonReader.commands.inventory.getTranslation(language).acceptedTitle, {
          pseudo: discordUser.username
        }), discordUser.displayAvatarURL())
          .setDescription(item.toString(language));
        if (item instanceof Potions) {
          entity.Player.Inventory.potion_id = item.id;
        }
        if (item instanceof Objects) {
          entity.Player.Inventory.backup_id = item.id;
        }
        if (item instanceof Weapons) {
          entity.Player.Inventory.weapon_id = item.id;
        }
        if (item instanceof Armors) {
          entity.Player.Inventory.armor_id = item.id;
        }
        await Promise.all([
          entity.save(),
          entity.Player.save(),
          entity.Player.Inventory.save()
        ]);
        return channel.send(embed);
      }
    }
    channel.send("vente de l'item à coder :)")
  });

  await msg.react(MENU_REACTION.ACCEPT);
  await msg.react(MENU_REACTION.DENY);
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @returns {Number}
 */
global.generateRandomRarity = () => {
  let randomValue = Math.round(
    Math.random() * JsonReader.values.raritiesGenerator.maxValue);

  if (randomValue <= JsonReader.values.raritiesGenerator['0']) {
    return 1;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['1']) {
    return 2;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['2']) {
    return 3;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['3']) {
    return 4;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['4']) {
    return 5;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['5']) {
    return 6;
  } else if (randomValue <= JsonReader.values.raritiesGenerator['6']) {
    return 7;
  }
  return 8;
};


/**
 * Generate a random itemType
 * @returns {Number}
 */
global.generateRandomItemType = () => {
  return JsonReader.values.itemGenerator.tab[Math.round(Math.random() * (JsonReader.values.itemGenerator.max - 1) + 1)];
};

/**
 * Convert a number of milliseconds in a number of minutes
 * @param {Number} milliseconds - The number of milliseconds
 * @return {Number}
 */
global.millisecondsToMinutes = (milliseconds) => {
  return Math.round(milliseconds / 60000);
};

/**
 * Convert a number of minutes in a number of milliseconds
 * @param {Number} minutes - The number of minutes
 * @return {Number}
 */
global.minutesToMilliseconds = (minutes) => {
  return minutes * 60000;
};

/**
 * Return a string containing a proper display of a duration
 * @param {Number} minutes - The number of minutes to display
 * @return {String}
 */
global.minutesToString = (minutes) => {
  let hours = Math.floor(minutes / 60);
  minutes = minutes - (hours * 60);

  let display = (hours > 0) ? hours + ' H ' : '';
  display += minutes + ' Min';
  if (hours >= 0 && minutes === 0) {
    display = '< 1 Min';
  }
  return display;
};

/**
 * @param {String} string
 * @param {Object} replacement
 * @return {String}
 */
global.format = (string, replacement) => {
  if (!replacement || !replacement.hasOwnProperty) {
    replacement = {};
  }

  return string.replace(/\{([0-9a-zA-Z_]+)\}/g, (match, i, index) => {
    let result;

    if (string[index - 1] === '{' &&
      string[index + match.length] === '}') {
      return i;
    } else {
      result = replacement.hasOwnProperty(i) ? replacement[i] : null;
      if (result === null || result === undefined) {
        return '';
      }

      return result;
    }
  });
};

/**
 * Generates a random int between min and max both included
 * @param {Number} min
 * @param {Number} max
 * @returns {number}
 */
global.randInt = (min, max) => {
  return Math.round(Math.random() * (max - min) + min);
};

// TODO 2.0 ProgressBar
/**
 * Create a text progress bar
 * @param {Number} value
 * @param {Number} maxValue
 * @returns {String} - The bar
 */
global.progressBar = (value, maxValue) => {
  let percentage = value / maxValue; //Calculate the percentage of the bar
  let progress = Math.round((PROGRESSBARS_SIZE * percentage)); //Calculate the number of square caracters to fill the progress side.
  let emptyProgress = PROGRESSBARS_SIZE - progress; //Calculate the number of dash caracters to fill the empty progress side.

  let progressText = '▇'.repeat(progress); //Repeat is creating a string with progress * caracters in it
  let emptyProgressText = '—'.repeat(emptyProgress); //Repeat is creating a string with empty progress * caracters in it
  let percentageText = Math.round(percentage * 100) + '%'; //Displaying the percentage of the bar

  let bar = '[' + progressText + emptyProgressText + '] ' + percentageText; //Creating the bar
  return bar;
};


// TODO 2.0 Legacy code
// /**
//  * convert a number of hours in a number of miliseconds
//  * @param hours - The number of hours
//  * @returns {Number} - The number of miliseconds
//  */
// const convertHoursInMiliseconds = function (hours) {
//   return this.convertMinutesInMiliseconds(hours * 60);
// };
//
// /**
//  * Return the id list of all the users of a server
//  * @param {*} message the message used to retrieve the server
//  */
// const getIdListServMember = function (message) {
//   let idlist = ""
//   message.guild.members.forEach(member => idlist += member.id + ",");
//   return idlist.substring(0, idlist.length - 1);
//
// }