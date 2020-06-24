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
 * @returns {String} - The bar
 */
// createBar({value, maxValue, barSize}) {
//   let percentage = this.value / this.maxValue; //Calculate the percentage of the bar
//   let progress = Math.round((this.barSize * percentage)); //Calculate the number of square caracters to fill the progress side.
//   let emptyProgress = this.barSize - progress; //Calculate the number of dash caracters to fill the empty progress side.
//
//   let progressText = '▇'.repeat(progress); //Repeat is creating a string with progress * caracters in it
//   let emptyProgressText = '—'.repeat(emptyProgress); //Repeat is creating a string with empty progress * caracters in it
//   let percentageText = Math.round(percentage * 100) + '%'; //Displaying the percentage of the bar
//
//   let bar = '[' + progressText + emptyProgressText + '] ' + percentageText; //Creating the bar
//   return bar;
// }
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
