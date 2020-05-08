class MessageError {

  /**
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @param {String} permission
   * @param {("fr"|"en")} language
   * @param {String[]} disallowEffects
   * @param {Entities} entity
   * @return {Promise<any>}
   */
  static async canPerformCommand(message, language, permission, disallowEffects, entity) {

    // Check role on permission
    if (permission === PERMISSION.ROLE.MANAGER || permission === PERMISSION.ROLE.ADMINISTRATOR) {
      console.log('// Implement me (Commands managers/admins)');
    }

    // Check entity on blockedList

    // Check disallowEffects on entity
    let disallowEffect = disallowEffects.indexOf(entity.effect);
    if (disallowEffect !== -1) {
      if (message.author.id === entity.discordUser_id) {
        return await MessageError.effectsErrorMe(message, language, entity, disallowEffects[disallowEffect]);
      } else {
        // MessageError.effectsErrorPlayer();
      }
    }

    return true;
  }

  static async effectsErrorMe(message, language, entity, effect) {
    let embed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.error);

    // 1 ::: Dans tout les cas on vas d'abord tester le status BABY sur l'entity
    if (entity.effect === EFFECT.BABY) {
      embed
          .setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsBaby, {pseudo: message.author.username}), message.author.displayAvatarURL())
          .setDescription(JsonReader.error.getTranslation(language).meIsBaby);
    }

    // 2 ::: On va tester tout les autres effects à partir de l'effect
    if (effect === EFFECT.SKULL) {
      embed
          .setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsSkull, {pseudo: message.author.username}), message.author.displayAvatarURL())
          .setDescription(JsonReader.error.getTranslation(language).meIsSkull);
    }

    return await message.channel.send(embed);
  }

  /**
   * Handle error if needed
   */
  static async errorPlayer(message, language, player) {
    let embed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.error)
        .setTitle(format(JsonReader.error.getTranslation(language).title, {pseudo: message.author.username}))
        .setAuthor(message.author.username, message.author.displayAvatarURL());

    if (player.effect === EFFECT.BABY) {
      embed
          .setDescription(JsonReader.error.getTranslation(language).playerIsBaby, {
            askedPseudo: player.getPseudo(language)
          });
    }

    if (player.effect === EFFECT.SKULL) {
      embed
          .setDescription(JsonReader.error.getTranslation(language).playerIsSkull, {
            askedPseudo: player.getPseudo(language)
          });
    }

    // TODO handle other effect error

    return await message.channel.send(embed);
  }

}

global.canPerformCommand = MessageError.canPerformCommand;
global.errorMe = MessageError.errorMe;
global.errorPlayer = MessageError.errorPlayer;
