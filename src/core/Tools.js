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
    display = 'Quelques secondes...'; // TODO 2.0 Should be translated
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
//  * convert a number of minutes in a number of miliseconds
//  * @param minutes - The number of minutes
//  * @returns {Number} - The number of miliseconds
//  */
// const convertMinutesInMiliseconds = function (minutes) {
//   return minutes * 60000;
// };
//
//
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
//  * Allow to get the language the bot has to respond with
//  * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
//  * @returns {String} - the code of the server language
//  */
// const detectLanguage = async function (message) {
//   let serverManager = new ServerManager();
//   let server = await serverManager.getServer(message);
//   if (message.channel.id == Config.ENGLISH_CHANNEL_ID) {
//     server.language = "en";
//   }
//   return server.language;;
// }
//
// /**
//  * Generate a random rarity. Legendary is very rare and common is not rare at all
//  * @returns {Number} - the number refering to a rarity (1 - 8)
//  */
// const generateRandomrarity = function () {
//   let randomValue = Math.round(Math.random() * DefaultValues.raritiesGenerator.maxValue);
//   let result;
//   if (randomValue <= DefaultValues.raritiesGenerator['0']) {
//     result = 1;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['1']) {
//     result = 2;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['2']) {
//     result = 3;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['3']) {
//     result = 4;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['4']) {
//     result = 5;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['5']) {
//     result = 6;
//   } else if (randomValue <= DefaultValues.raritiesGenerator['6']) {
//     result = 7;
//   } else {
//     result = 8;
//   }
//   return result;
// };
//
// /**
//  * Allow to add to the player stats the bonuses of its items
//  * @param {*} player - One of the player that has to recieve the bonus
//  */
// const addItemBonus = async function (player) {
//   let inventoryManager = new InventoryManager()
//   let bonus = await inventoryManager.getDamageById(player.id);
//   player.attack = player.attack + bonus;
//   bonus = await inventoryManager.getDefenseById(player.id);
//   player.defense = player.defense + bonus;
//   bonus = await inventoryManager.getSpeedById(player.id);
//   player.speed = player.speed + bonus;
// }
//
// /**
//  * Allow to add to the player stats the bonuses of its items
//  * @param {*} player - One of the player that has to recieve the bonus
//  */
// const seeItemBonus = async function (player) {
//   let inventoryManager = new InventoryManager()
//   let bonus = await inventoryManager.seeDamageById(player.id);
//   player.attack = player.attack + bonus;
//   bonus = await inventoryManager.seeDefenseById(player.id);
//   player.defense = player.defense + bonus;
//   bonus = await inventoryManager.seeSpeedById(player.id);
//   player.speed = player.speed + bonus;
// }
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
