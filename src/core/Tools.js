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
  message.attachments.forEach((element) => {
    channel.send({
      files: [{
        attachment: element.url,
        name: element.filename,
      }],
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
  const embed = new discord.MessageEmbed();
  embed.setColor(JsonReader.bot.embed.error)
    .setAuthor(format(JsonReader.error.getTranslation(language).title, {
      pseudo: user.username,
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
  const item = await entity.Player.Inventory.generateRandomItem();
  let embed = new discord.MessageEmbed();
  embed.setAuthor(format(JsonReader.commands.inventory.getTranslation(language).randomItemTitle, {
    pseudo: discordUser.username,
  }), discordUser.displayAvatarURL())
    .setDescription(item.toString(language));
  if (item instanceof Potions) {
    const potion = await entity.Player.Inventory.getPotion();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: potion.toString(language),
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: potion.toString(language),
    }));
  }
  if (item instanceof Objects) {
    const object = await entity.Player.Inventory.getBackupObject();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: object.toString(language),
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: object.toString(language),
    }));
  }
  if (item instanceof Weapons) {
    const weapon = await entity.Player.Inventory.getWeapon();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: weapon.toString(language),
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: weapon.toString(language),
    }));
  }
  if (item instanceof Armors) {
    const armor = await entity.Player.Inventory.getArmor();
    embed.addField(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, {
      actualItem: armor.toString(language),
    }), format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
      actualItem: armor.toString(language),
    }));
  }

  const msg = await channel.send(embed);
  const filterConfirm = (reaction, user) => {
    return ((reaction.emoji.name == MENU_REACTION.ACCEPT || reaction.emoji.name == MENU_REACTION.DENY) && user.id === discordUser.id);
  };

  const collector = msg.createReactionCollector(filterConfirm, {
    time: 120000,
    max: 1,
  });

  collector.on('end', async (reaction) => {
    if (reaction.first()) { // a reaction exist
      // msg.delete(); for now we are goig to keep the message
      if (reaction.first().emoji.name == MENU_REACTION.ACCEPT) {
        embed = new discord.MessageEmbed();
        embed.setAuthor(format(JsonReader.commands.inventory.getTranslation(language).acceptedTitle, {
          pseudo: discordUser.username,
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
          entity.Player.Inventory.save(),
        ]);
        return channel.send(embed);
      }
    }
    const money = getItemValue(item);
    entity.Player.addMoney(money);
    await entity.Player.save();
    return await channel.send(
      format(JsonReader.commands.sell.getTranslation(language).soldMessage,
        {
          item: item.getName(language),
          money: money
        },
      ));
  });
  await Promise.all([
    msg.react(MENU_REACTION.ACCEPT),
    msg.react(MENU_REACTION.DENY),
  ]);
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @return {Number}
 */
global.generateRandomRarity = () => {
  const randomValue = Math.round(
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
 * @return {Number}
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
 * Convert a number of milliseconds in a number of hours
 * @param {Number} milliseconds - The number of milliseconds
 * @return {Number}
 */
global.millisecondsToHours = (milliseconds) => {
  return Math.round(milliseconds / 3600000);
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
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;

  let display;
  if (hours > 0) {
    display = hours + ' H ' + minutes + " Min";
  }
  else if (minutes !== 0) {
    display = minutes + ' Min';
  }
  else {
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
 * Generates a random int between min and max, both included
 * @param {Number} min
 * @param {Number} max
 * @return {number}
 */
global.randInt = (min, max) => {
  return Math.round(Math.random() * (max - min) + min);
};

/**
 * Create a text progress bar
 * @param {Number} value
 * @param {Number} maxValue
 * @return {String} - The bar
 */
global.progressBar = (value, maxValue) => {
  const percentage = value / maxValue; // Calculate the percentage of the bar
  const progress = Math.round((PROGRESSBARS_SIZE * percentage)); // Calculate the number of square caracters to fill the progress side.
  const emptyProgress = PROGRESSBARS_SIZE - progress; // Calculate the number of dash caracters to fill the empty progress side.

  const progressText = '▇'.repeat(progress); // Repeat is creating a string with progress * caracters in it
  const emptyProgressText = '—'.repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
  const percentageText = Math.round(percentage * 100) + '%'; // Displaying the percentage of the bar

  const bar = '```[' + progressText + emptyProgressText + ']' + percentageText + '```'; // Creating the bar
  return bar;
};

/**
 * Return the value of the item
 * @param {Objects|Armors|Weapons|Potions} item
 * @return {Number} - The value of the item
 */
global.getItemValue = function (item) {
  let addedvalue;
  if (item instanceof Potions || item instanceof Objects) {
    addedvalue = parseInt(item.power);
  }
  if (item instanceof Weapons) {
    addedvalue = parseInt(item.rawAttack);
  }
  if (item instanceof Armors) {
    addedvalue = parseInt(item.rawDefense);
  }
  return parseInt(JsonReader.values.raritiesValues[item.rarity]) + addedvalue;
};

/**
 * Send an error if the user is blocked by a command
 * @param {module:"discord.js".User} user
 * @param {module:"discord.js".TextChannel} channel
 * @param {"fr"|"en"} language
 * @returns {boolean}
 */
global.sendBlockedError = async function (user, channel, language) {
  if (hasBlockedPlayer(user.id)) {
    await sendErrorMessage(user, channel, language, JsonReader.error.getTranslation(language).playerBlocked);
    return true;
  }
  return false;
};

/**
 * Returns the next sunday 23h59 59s
 * @return {Date}
 */
global.getNextSundayMidnight = function() {
  let now = new Date();
  let dateOfReset = new Date();
  dateOfReset.setDate(now.getDate() + ((7 - now.getDay())) % 7);
  dateOfReset.setHours(23, 59, 59);
  while (dateOfReset < now) {
    dateOfReset += 1000*60*60*24*7;
  }
  return new Date(dateOfReset);
};

global.parseTimeDifference = function(date1, date2, language) {
  if (date1 > date2) {
    date1 = [date2, date2 = date1][0];
  }
  let seconds = Math.floor((date2 - date1) / 1000);
  let parsed = "";
  let days = Math.floor(seconds / (24*60*60));
  if (days > 0) {
    parsed += days + (language === "fr" ? " J " : " D ");
    seconds -= days * 24*60*60;
  }
  let hours = Math.floor(seconds / (60*60));
  parsed += hours + " H ";
  seconds -= hours * 60*60;
  let minutes = Math.floor(seconds / 60);
  parsed += minutes + " Min ";
  seconds -= minutes * 60;
  parsed += seconds + " s";
  return parsed;
};

/**
 * Block commands if it is 5 minutes before top week reset
 * @return {boolean}
 */
global.resetIsNow = function() {
  return getNextSundayMidnight() - new Date() <= 1000*5*60;
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
