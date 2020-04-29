/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
  let player = await draftbot.getRepository('player').getByMessageOrCreate(
      message);
  let profilEmbed = await player.profilEmbed(language);

  const embed = new draftbot.discord.MessageEmbed()
      .setColor(Config.embed.color)
      .setTitle(profilEmbed.shift())
      .addFields(profilEmbed);

  await message.channel.send(embed);

  if (args[1] !== undefined) {
    // TODO 2.0 Continue refactoring
    // let playerId;
    // player = await getAskedPlayer(playerId, player, playerManager, message, args); //recupération de l'id du joueur demandé
    // if (askedPlayerIsInvalid(player))
    //     return message.channel.send(Text.commands.profile.errorMain + "**" + message.author.username + "**" + Text.commands.profile.errorExp)
  }

  // let numberOfPlayer = await playerManager.getNumberOfPlayers();
  // await Tools.seeItemBonus(player)
  // let messageProfile = generateProfileMessage(message, player, numberOfPlayer, client, language);
  // message.channel.send(messageProfile).then(msg => {
  //     displayBadges(player, msg);
  // });
};

/**
 * Returns a string containing the profile message.
 * @returns {String} - A string containing the profile message.
 * @param {*} message - The message that caused the command to be triggered
 * @param {*} player - The player that send the message
 * @param {Integer} numberOfPlayer - The total number of player in the database
 * @param {*} client - The bot client
 * @param {String} language - The language the answer has to be displayed in
 */
const generateProfileMessage = function(
    message, player, numberOfPlayer, client, language) {

  if (player.getEffect() == ':baby:') {
    return player.getEffect() + Text.commands.profile.main + '**' + pseudo +
        '**' + Text.commands.profile.notAPlayer;
  }

  if (playerManager.displayTimeLeftProfile(player, message, language) != '') {
    let timeLeftMessage;
    if (!playerManager.displayTimeLeftProfile(player, message, language)
        .includes(':hospital:')) { //the player is not cured
      timeLeftMessage = player.getEffect() + ' ' +
          playerManager.displayTimeLeftProfile(player, message, language);
    } else {
      timeLeftMessage = playerManager.displayTimeLeftProfile(player, message,
          language);
    }
    embed.addField(Text.commands.profile.timeleft, timeLeftMessage);
  }

  return embed;
};

/**
 * Allow to recover the asked player if needed
 * @param {*} playerId - The asked id of the player
 * @param {*} player - The player that is asked for
 * @param {*} playerManager - The player manager
 * @param {*} message - The message that initiate the command

 */
async function getAskedPlayer(playerId, player, playerManager, message, args) {
  if (isNaN(args[1])) {
    try {
      playerId = message.mentions.users.last().id;
    } catch (err) { // the input is not a mention or a user rank
      playerId = '0';
    }
  } else {
    playerId = await playerManager.getIdByRank(args[1]);

  }
  player = await playerManager.getPlayerById(playerId, message);
  return player;
}

/**
 * check if the asked player is valid
 * @param {*} player - The player that has been asked for
 */
function askedPlayerIsInvalid(player) {
  return player.getEffect() == ':baby:';
}

/**
 * display the badges of the player if he have some
 * @param {*} player - The player that is displayed
 * @param {*} msg - The message that contain the profile of the player
 */
async function displayBadges(player, msg) {
  if (player.getBadges() != '') {
    let str = player.getBadges();
    str = str.split('-');
    for (var i = 0; i < str.length; i++) {
      await msg.react(str[i]);
    }
  }
}

module.exports = {
  'profile': ProfileCommand,
  'p': ProfileCommand,
};
