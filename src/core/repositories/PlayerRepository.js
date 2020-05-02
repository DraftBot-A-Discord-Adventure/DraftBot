const AppRepository = require('repositories/AppRepository');
const Player = require('entities/Player');

/**
 * @property {String} datasource
 * @property {module:sqlite3.Database} sql
 */
class PlayerRepository extends AppRepository {

  constructor() {
    super();
    this.datasource = DATASOURCE.SQLITE;
  }

  /**
   * Return a promise that will contain the player that sent a message once it has been resolved
   * @param {module:"discord.js".Message} message
   * @return {Promise<Player>}
   */
  async getByMessageOrCreate(message) {
    return this.sql
        .get(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE discordId = ?`,
            message.author.id)
        .then(async player => {
          if (player) {
            return new Player(player);
          } else {
            return await this.create(new Player(
                Object.assign({
                  id: message.author.id,
                  lastReport: message.createdTimestamp,
                }, JsonReader.entities.player)));
          }
        })
        .catch(console.error);
  }

  /**
   * Return a promise that will contain the player that sent a message once it has been resolved
   * @param {Number} id
   * @return {Promise<Player>}
   */
  async getByIdOrCreate(id) {
    return this.sql
        .get(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE discordId = ?`,
            id)
        .then(async player => {
          if (player) {
            return new Player(player);
          } else {
            return await this.create(new Player(
                Object.assign({
                  id: id,
                  lastReport: Date.now(),
                }, JsonReader.entities.player)));
          }
        })
        .catch(console.error);
  }

  /**
   * Allow to save a new player in the database and return it
   * @param {Player} player
   * @return {Promise<Player|void>}
   */
  async create(player) {
    await this.sql.run(
          `INSERT INTO entity (id, maxHealth, health, attack, defense, speed, effect) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        player.id, player.maxHealth, player.health, player.attack,
        player.defense, player.speed, player.effect,
        )
        .catch(console.error);

    await this.sql.run(
          `INSERT INTO player (discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        player.discordId, player.score,
        player.weeklyScore, player.level,
        player.experience, player.money,
        player.lastReport, player.badges,
        player.guildId,
        )
        .catch(console.error);

    return player;
  }

  /**
   * Allow to update a player in the database and return it
   * @param {Player} player
   * @return {Promise<Player|void>}
   */
  async update(player) {
    await this.sql
        .run(
              `UPDATE entity SET maxHealth = ?, health = ?, attack = ?, defense = ?, speed = ?, effect = ? WHERE id = ?`,
            player.maxHealth, player.health, player.attack,
            player.defense, player.speed, player.effect,
            player.id,
        )
        .catch(console.error);

    await this.sql
        .run(
              `UPDATE player SET score = ?, weeklyScore = ?, level = ?, experience = ?, money = ?, lastReport = ?, badges = ?, guildId = ? WHERE discordId = ?`,
            player.score,
            player.weeklyScore, player.level,
            player.experience, player.money,
            player.lastReport, player.badges,
            player.guildId, player.discordId,
        )
        .catch(console.error);

    return player;
  }

  /**
   * Get the total number of players in the database
   * @returns {Promise<number>}
   */
  async getNumberOfPlayers() {
    let result = await this.sql
        .get(`SELECT COUNT(*) as count FROM player WHERE score > 100`) // TODO 2.1 Creer un systeme qui clean les joueurs inactifs, pour enlever le > 100
        .catch(console.error);

    return result.count;
  }

  // TODO 2.0 Legacy code
  // async resetWeeklyScoreAndRank() {
  //   await this.sql.run('UPDATE player SET weeklyScore = ?', 0)
  //       .catch(console.error);
  // }
  //
  // /**
  //  * Get the rank of a player on a server
  //  * @param idList - The list of ids of the players of the server
  //  * @param id - The id of the player
  //  * @returns {Integer} - The server rank of the player
  //  */
  // getServRank(idList, id) {
  //   return sql.get(`SELECT rank FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) AS rank FROM entity JOIN player on entity.id = player.discordId  AND entity.id IN(${idList}) ) WHERE score > 100 AND id=${id} ORDER BY score DESC`).then(player => {
  //     return player.rank
  //   }).catch(error => { //there is no database
  //     console.error(error)
  //     return 0;
  //   })
  // }
  //
  //
  // /**
  //  * Return a promise that will contain the player that sent a message once it has been resolved
  //  * @param id - The id of the user
  //  * @param message - The message that caused the user to be called
  //  * @returns {promise} - The promise that will be resolved into a player
  //  */
  // getPlayerById(id, message) {
  //   return sql.get(`SELECT *FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE discordId = ?`, ["" + id]).then(player => {
  //     if (!player) { //player is not in the database
  //       console.log(`user unknown : ${id}`);
  //       return this.getNewPlayerById(id, message);
  //     } else { //player is in the database
  //       console.log(`user loaded : ${id}`);
  //       return new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed,
  //           player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport, player.badges,
  //           player.rank, player.weeklyScore, player.weeklyRank, player.guildId)
  //     }
  //   }).catch(error => { //there is no database
  //     console.error(error)
  //     return false;
  //   })
  // }
  //
  //
  // /**
  //  * Return a promise that will contain theid of the player matching a rank given as an input
  //  * @param rank - The rank of the user
  //  * @returns {promise} - The promise that will be resolved into a player
  //  */
  // getIdByRank(rank) {
  //   return sql.get(`SELECT *FROM(SELECT discordId, ROW_NUMBER () OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE rank = ?`, ["" + rank]).then(id => {
  //     return id.discordId;
  //   }).catch(error => { //there is no database
  //     console.error(error)
  //     return false;
  //   })
  // }
  //
  //
  // /**
  //  * Allow to save the current state of a player in the database
  //  * @param {*} player - The player that has to be saved
  //  */
  // updatePlayer(player) {
  //   console.log("Updating player ...");
  //   sql.run(`UPDATE entity SET maxHealth = ?, health = ?, attack = ?, defense = ?, speed = ?, effect = ? WHERE id = ?`,
  //       [player.maxHealth, player.health, player.attack, player.defense, player.speed, "" + player.effect, player.discordId]).catch(console.error);
  //   sql.run(``,
  //       [player.score, player.level, player.experience, player.money, player.lastReport, "" + player.badges, player.weeklyScore, player.guildId, player.discordId]).catch(console.error);
  //   console.log("Player updated !");
  // }
  //
  // /**
  //  * Allow to save the new score of a player without saving the other attributes
  //  * @param {*} player - The player that has to be saved
  //  */
  // updatePlayerScore(player) {
  //   console.log("Updating player ...");
  //   sql.run(`UPDATE player SET score = ? WHERE discordId = ?`, [player.score, player.discordId]).catch(console.error);
  //   sql.run(`UPDATE player SET weeklyScore = ? WHERE discordId = ?`, [player.weeklyScore, player.discordId]).catch(console.error);
  //   console.log("Player updated !");
  // }
  //
  // /**
  //  * Get the total number of player in the database that are on the idList given
  //  * @param {*} idList the list of id of the users of a server
  //  */
  // getNumberOfServPlayers(idList) {
  //   return sql.get(`SELECT COUNT(*) AS count FROM player WHERE score >100 AND discordId IN(${idList})`)
  //       .then(number => {
  //         return number.count
  //       })
  //       .catch(error => { //there is no database
  //         console.error(error)
  //         return 0;
  //       });
  // }
  //
  // /**
  //  * Get the total number of players in the database that played this week
  //  * @returns {Integer} - The number of players
  //  */
  // getNumberOfWeeklyPlayers() {
  //   return sql.get(`SELECT COUNT(*) AS count FROM player WHERE weeklyScore > 0`)
  //       .then(number => {
  //         return number.count
  //       })
  //       .catch(error => { //there is no database
  //         console.error(error)
  //         return 0;
  //       });
  // }
  //
  // /**
  //  * Allow to get the language the bot has to respond with
  //  * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
  //  * @returns {String} - the code of the server language
  //  */
  // async detectLanguage(message) {
  //   let serverManager = new ServerManager();
  //   let server = await serverManager.getServer(message);
  //   if (message.channel.id == Config.ENGLISH_CHANNEL_ID) {
  //     server.language = "en";
  //   }
  //   return server.language;
  // }
  //
  // /**
  //  * give to the player that send the message a random item
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the channel where the message has been send
  //  * @param {*} player - The player that is playing
  //  * @param {boolean} displayNameIfSold - Display the name of the item if the item is sold
  //  */
  // async giveRandomItem(message, player, displayNameIfSold) {
  //   let inventoryManager = new InventoryManager();
  //   let equipementManager = new EquipementManager();
  //   let potionManager = new PotionManager();
  //   let objectManager = new ObjectManager();
  //   let inventory = await inventoryManager.getCurrentInventory(message);
  //   let type = this.chooseARandomItemType();
  //   switch (type) {
  //     case "weapon":
  //       player = await this.giveRandomWeapon(equipementManager, inventory, message, inventoryManager, player, displayNameIfSold);
  //       break;
  //     case "armor":
  //       player = await this.giveRandomArmor(equipementManager, inventory, message, inventoryManager, player, displayNameIfSold);
  //       break;
  //     case "object":
  //       player = await this.giveRandomObject(objectManager, inventory, message, inventoryManager, player, displayNameIfSold);
  //       break;
  //     case "potion":
  //       player = await this.giveRandomPotion(potionManager, inventory, message, inventoryManager, player, displayNameIfSold);
  //       break;
  //     default:
  //       // this is never supposed to occure
  //       break;
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * give to the player that send the message a random item
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the channel where the message has been send
  //  * @param {*} player - The player that is playing
  //  */
  // async giveItem(message, player, item) {
  //   let inventoryManager = new InventoryManager();
  //   let equipementManager = new EquipementManager();
  //   let potionManager = new PotionManager();
  //   let objectManager = new ObjectManager();
  //   let inventory = await inventoryManager.getCurrentInventory(message);
  //   let type = item.type();
  //   switch (type) {
  //     case "weapon":
  //       player = await this.giveWeapon(equipementManager, inventory, message, inventoryManager, player, item.id);
  //       break;
  //     case "armor":
  //       player = await this.giveArmor(equipementManager, inventory, message, inventoryManager, player, item.id);
  //       break;
  //     case "object":
  //       player = await this.giveObject(objectManager, inventory, message, inventoryManager, player, item.id);
  //       break;
  //     case "potion":
  //       player = await this.givePotion(potionManager, inventory, message, inventoryManager, player, item.id);
  //       break;
  //     default:
  //       message.channel.send("item à donner de type :" + type);
  //       break;
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a SELECTed armor into an inventory and save the result
  //  * @param {*} equipementManager - The equipement manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {*} id - The id of the armor
  //  */
  // async giveArmor(equipementManager, inventory, message, inventoryManager, player, id) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let armor = await equipementManager.getArmorById(id);
  //   let neww = equipementManager.getEquipementEfficiency(armor);
  //   let old = equipementManager.getEquipementEfficiency(equipementManager.getArmorById(inventory.armorId));
  //   if (neww > old) {
  //     inventory.armorId = armor.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + equipementManager.displayArmor(armor, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, armor, false, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a SELECTed armor into an inventory and save the result
  //  * @param {*} equipementManager - The equipement manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {*} id - The id of the weapon
  //  */
  // async giveWeapon(equipementManager, inventory, message, inventoryManager, player, id) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let weapon = await equipementManager.getWeaponById(id);
  //   let neww = equipementManager.getEquipementEfficiency(weapon);
  //   let old = equipementManager.getEquipementEfficiency(equipementManager.getWeaponById(inventory.weaponId));
  //   if (neww > old) {
  //     inventory.weaponId = weapon.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + equipementManager.displayWeapon(weapon, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, weapon, false, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a SELECTed object into an inventory and save the result
  //  * @param {*} objectManager - The object manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {*} id - The id of the object
  //  */
  // async giveObject(objectManager, inventory, message, inventoryManager, player, id) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let object = await objectManager.getObjectById(id);
  //   let neww = objectManager.getObjectEfficiency(object);
  //   let old = objectManager.getObjectEfficiency(objectManager.getObjectById(inventory.backupItemId));
  //   if (neww > old) {
  //     inventory.backupItemId = object.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + objectManager.displayObject(object, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, object, false, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a SELECTed potion into an inventory and save the result
  //  * @param {*} potionManager - The potion manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {*} id - The id of the potion
  //  */
  // async givePotion(potionManager, inventory, message, inventoryManager, player, id) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let potion = await potionManager.getPotionById(id);
  //   let neww = potionManager.getPotionEfficiency(potion);
  //   let old = potionManager.getPotionEfficiency(potionManager.getPotionById(inventory.potionId));
  //   if (neww > old) {
  //     inventory.potionId = potion.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + potionManager.displayPotion(potion, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, potion, false, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a random armor into an inventory and save the result
  //  * @param {*} equipementManager - The equipement manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {boolean} displayNameIfSold - Display the name of the item if the item is sold
  //  */
  // async giveRandomArmor(equipementManager, inventory, message, inventoryManager, player, displayNameIfSold) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let armor = await equipementManager.generateRandomArmor();
  //   let neww = equipementManager.getEquipementEfficiency(armor);
  //   let old = equipementManager.getEquipementEfficiency(equipementManager.getArmorById(inventory.armorId));
  //   if (neww > old) {
  //     inventory.armorId = armor.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + equipementManager.displayArmor(armor, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, armor, displayNameIfSold, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a random armor into an inventory and save the result
  //  * @param {*} equipementManager - The equipement manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {boolean} displayNameIfSold - Display the name of the item if the item is sold
  //  */
  // async giveRandomWeapon(equipementManager, inventory, message, inventoryManager, player, displayNameIfSold) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let weapon = await equipementManager.generateRandomWeapon();
  //   let neww = equipementManager.getEquipementEfficiency(weapon);
  //   let old = equipementManager.getEquipementEfficiency(equipementManager.getWeaponById(inventory.weaponId));
  //   if (neww > old) {
  //     inventory.weaponId = weapon.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + equipementManager.displayWeapon(weapon, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, weapon, displayNameIfSold, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a random object into an inventory and save the result
  //  * @param {*} objectManager - The object manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {boolean} displayNameIfSold - Display the name of the item if the item is sold
  //  */
  // async giveRandomObject(objectManager, inventory, message, inventoryManager, player, displayNameIfSold) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let object = await objectManager.generateRandomObject();
  //   let neww = objectManager.getObjectEfficiency(object);
  //   let old = objectManager.getObjectEfficiency(objectManager.getObjectById(inventory.backupItemId));
  //   if (neww > old) {
  //     inventory.backupItemId = object.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + objectManager.displayObject(object, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, object, displayNameIfSold, message, language);
  //   }
  //   return player
  // }
  //
  //
  // /**
  //  * add a random potion into an inventory and save the result
  //  * @param {*} potionManager - The potion manager class
  //  * @param {*} inventory - the inventory of the player
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the author
  //  * @param {*} inventoryManager - The inventory manager class
  //  * @param {*} player - The player that is playing
  //  * @param {boolean} displayNameIfSold - Display the name of the item if the item is sold
  //  */
  // async giveRandomPotion(potionManager, inventory, message, inventoryManager, player, displayNameIfSold) {
  //   Text = await chargeText(message);
  //   let language = await this.detectLanguage(message);
  //   let potion = await potionManager.generateRandomPotion();
  //   let neww = potionManager.getPotionEfficiency(potion);
  //   let old = potionManager.getPotionEfficiency(potionManager.getPotionById(inventory.potionId));
  //   if (neww > old) {
  //     inventory.potionId = potion.id;
  //     message.channel.send(Text.playerManager.newItemEmoji + mentionPlayer(player) + Text.playerManager.newItem + potionManager.displayPotion(potion, language));
  //     inventoryManager.updateInventory(inventory);
  //   }
  //   else {
  //     player = this.sellItem(player, potion, displayNameIfSold, message, language);
  //   }
  //   return player
  // }
  //
  // /**
  //  * Select a random item Type
  //  * @returns {String} - The type of the item that has been SELECTed
  //  */
  // chooseARandomItemType() {
  //   return DefaultValues.itemGenerator.tab[Math.round(Math.random() * (DefaultValues.itemGenerator.max - 1) + 1)];
  // };
  //
  //
  // /**
  //  * allow the player to gain some money corresponding to an equipement
  //  * @param {Item} item - The equipement that has to be sold
  //  * @param {*} player - The player that will recieve the money
  //  * @param {boolean} displayName - Displays or not the name of the item
  //  * @param {*} message - The message that caused the function to be called. Used to retrieve the channel
  //  * @param {String} language - The language the answer has to be displayed in
  //  */
  // sellItem(player, item, displayName, message, language) {
  //   Text = require('../text/' + language);
  //   let value = item.getValue();
  //   console.log("the item has been sold ! " + item.rarity + " / " + item.power);
  //   player.addMoney(value);
  //   if (displayName) {
  //     message.channel.send(Text.playerManager.sellEmoji + mentionPlayer(player) + Text.playerManager.sellItem1 + new ItemManager().getItemSimpleName(item, language) + Text.playerManager.sellItem2 + value + Text.playerManager.sellEnd);
  //   } else {
  //     message.channel.send(Text.playerManager.sellEmoji + mentionPlayer(player) + Text.playerManager.sell + value + Text.playerManager.sellEnd);
  //   }
  //   return player;
  // }
  //
  // /**
  //  * Allow to retrieve the data FROM the top between 2 limits
  //  * @param {Integer} borneinf - The lower limit of the top
  //  * @param {Integer} bornesup - The uppper limit of the top
  //  * @returns {*} -The data of the top (an array of players)
  //  */
  // getTopData(borneinf, bornesup) {
  //   let playerArray = Array();
  //   let i = 0;
  //   return sql.all(`SELECT *FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) AS rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) AS weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE rank >= ? AND rank <= ? AND score > 100 ORDER BY score DESC`, [borneinf, bornesup]).then(data => {
  //     data.forEach(function (player) {
  //       playerArray[i] = new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed,
  //           player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport, player.badges, player.rank, player.weeklyScore,
  //           player.weeklyRank, player.guildId)
  //       i++;
  //     });
  //     return playerArray;
  //   });
  // }
  //
  // /**
  //  * Allow to retrieve the data FROM the top between 2 limits
  //  * @param {Integer} borneinf - The lower limit of the top
  //  * @param {Integer} bornesup - The uppper limit of the top
  //  * @param {String} idList - The list of id where the discord id of the user has to be
  //  * @returns {*} -The data of the top (an array of players)
  //  */
  // getTopServData(borneinf, bornesup, idList) {
  //   let playerArray = Array();
  //   let i = 0;
  //   return sql.all(`SELECT *FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) AS rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) AS weeklyRank FROM entity JOIN player on entity.id = player.discordId  AND entity.id IN(${idList}) ) WHERE rank >= ? AND rank <= ? AND score > 100 ORDER BY score DESC`, [borneinf, bornesup]).then(data => {
  //     data.forEach(function (player) {
  //       playerArray[i] = new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed,
  //           player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport, player.badges, player.rank, player.weeklyScore,
  //           player.weeklyRank, player.guildId)
  //       i++;
  //     });
  //     return playerArray;
  //   });
  // }
  //
  // /**
  //  * Allow to retrieve the data FROM the top between 2 limits
  //  * @param {Integer} borneinf - The lower limit of the top
  //  * @param {Integer} bornesup - The uppper limit of the top
  //  * @returns {*} -The data of the top (an array of players)
  //  */
  // getTopWeekData(borneinf, bornesup) {
  //   let playerArray = Array();
  //   let i = 0;
  //   return sql.all(`SELECT *FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE weeklyRank >= ? AND weeklyRank <= ? AND weeklyScore > 0 ORDER BY weeklyScore DESC`, [borneinf, bornesup]).then(data => {
  //     data.forEach(function (player) {
  //       playerArray[i] = new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed,
  //           player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport, player.badges, player.rank, player.weeklyScore,
  //           player.weeklyRank, player.guildId)
  //       i++;
  //     });
  //     return i === 0 ? null : playerArray;
  //   });
  // }
  //
  // /**
  //  * @returns {*} -The rank of the player
  //  */
  // async getPlayerRank(playerId) {
  //   return sql.all(`select *from(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM player) WHERE discordId = ? AND score > 100 ORDER BY score DESC`, [playerId]).then(player => {
  //     let playerRank = player[0];
  //     if (playerRank === undefined) return "0";
  //     return playerRank.rank;
  //   });
  // }
  //
  // function mentionPlayer(player) {
  //   return "<@" + player.discordId + ">";
  // }

}

module.exports = PlayerRepository;
