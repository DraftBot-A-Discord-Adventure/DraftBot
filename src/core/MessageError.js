class MessageError {

  /**
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @param {String} permission
   * @param {("fr"|"en")} language
   * @param {String[]} disallowEffects
   * @param {Entities} entity
   * @return {Promise<any>}
   */
  static async canPerformCommand(message, language, permission, disallowEffects = null, entity = null) {


    if (permission === PERMISSION.ROLE.BADGEMANAGER) {
      if (!message.member.roles.cache.has(JsonReader.app.BADGE_MANAGER_ROLE)) {
        return await MessageError.permissionErrorMe(message, language, permission);
      }
    }

    if (permission === PERMISSION.ROLE.SUPPORT) {
      if (!message.member.roles.cache.has(JsonReader.app.SUPPORT_ROLE)) {
        return await MessageError.permissionErrorMe(message, language, permission);
      }
    }

    if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
      if (!message.member.hasPermission("ADMINISTRATOR")) {
        return await MessageError.permissionErrorMe(message, language, permission);
      }
    }

    if (permission === PERMISSION.ROLE.BOTOWNER) {
      if (message.author.id != JsonReader.app.BOT_OWNER_ID) {
        return await MessageError.permissionErrorMe(message, language, permission);
      }
    }

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

  /**
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @param {("fr"|"en")} language
   * @param {String} permission
   * @return {Promise<Message>}
   */
  static async permissionErrorMe(message, language, permission) {
    let embed = new discord.MessageEmbed()
      .setColor(JsonReader.bot.embed.error);

    if (permission === PERMISSION.ROLE.BADGEMANAGER) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.error.getTranslation(language).badgeManagerPermissionMissing);
    }

    if (permission === PERMISSION.ROLE.SUPPORT) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.error.getTranslation(language).dmSupportPermissionMissing);
    }

    if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.error.getTranslation(language).administratorPermissionMissing);
    }

    if (permission === PERMISSION.ROLE.BOTOWNER) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.error.getTranslation(language).botOwnerPermissionMissing);
    }

    return await message.channel.send(embed);
  }

  /**
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @param {("fr"|"en")} language
   * @param {Entities} entity
   * @param {String} effect
   * @return {Promise<Message>}
   */
  static async effectsErrorMe(message, language, entity, effect) {
    let embed = new discord.MessageEmbed()
      .setColor(JsonReader.bot.embed.error);

    // 1 ::: Dans tout les cas on vas d'abord tester le status BABY sur l'entity
    if (entity.effect === EFFECT.BABY) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsBaby, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.error.getTranslation(language).meIsBaby);
    }

    // 2 ::: On va tester tout les autres effects à partir de l'effect
    if (effect === EFFECT.SKULL) {
      embed
        .setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsSkull, { pseudo: message.author.username }), message.author.displayAvatarURL())
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
      .setTitle(format(JsonReader.error.getTranslation(language).title, { pseudo: message.author.username }))
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
