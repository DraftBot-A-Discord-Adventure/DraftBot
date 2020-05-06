class MessageError {

  /**
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @param {String} permission
   * @param {("fr"|"en")} language
   * @param {String} effect
   * @param {Player} player
   * @return {Promise<any>}
   */
  static async canPerformCommand(message, language, permission, effect, player) {
    if (permission === PERMISSION.ROLE.MANAGER || permission === PERMISSION.ROLE.ADMINISTRATOR) {
      console.log('// Implement me');
    }

    await MessageError.errorMe(message, language, player);
  }

  /**
   * Handle error if needed
   */
  static async errorMe(message, language, player) {
    let embed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.error)
        // .setTitle(JsonReader.error.getTranslation(language).title)
        .setAuthor(message.author.username + JsonReader.error.getTranslation(language).title, message.author.displayAvatarURL());

    if (player.effect === EFFECT.BABY) {
      embed
          .addFields({
            name: JsonReader.error.getTranslation(language).title,
            value: JsonReader.error.getTranslation(language).meIsBaby
          });
    }

    if (player.effect === EFFECT.SKULL) {
      embed
          .setDescription(JsonReader.error.getTranslation(language).meIsSkull);
    //       .addFields({
    //         name: '\u200b',
    //         value:
    //       });
    }

    // TODO handle other effect error

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
