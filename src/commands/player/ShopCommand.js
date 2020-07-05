const Shop = require('core/Shop');

/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ShopCommand = async function(language, message, args) {
  const [entity] = await Entities.getOrRegister(message.author.id);
  new Shop(message.author, entity, message, language).open();
};

module.exports = {
  'shop': ShopCommand,
  's': ShopCommand,
};
