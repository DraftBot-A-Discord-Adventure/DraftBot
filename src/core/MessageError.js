class MessageError {

  /**
   * Handle error if needed
   */
  static async errorMe(message, language, player) {
    let embed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.error)
        .setTitle(format(JsonReader.error.getTranslation(language).title,
            {pseudo: message.author.username}));

    if (player.effect === EFFECT.BABY) {
      embed
          .setDescription(JsonReader.error.getTranslation(language).meIsBaby);
    }

    if (player.effect === EFFECT.SKULL) {
      embed
          .setDescription(JsonReader.error.getTranslation(language).meIsSkull);
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
        .setTitle(format(JsonReader.error.getTranslation(language).title,
            {pseudo: message.author.username}));

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

global.errorMe = MessageError.errorMe;
global.errorPlayer = MessageError.errorPlayer;
