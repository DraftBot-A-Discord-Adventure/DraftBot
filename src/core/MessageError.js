class MessageError {

  /**
   * Handle error if needed
   */
  static async error(message, language, description) {
    return await message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.error)
            .setTitle(format(JsonReader.error.getTranslation(language).title, {pseudo: message.author.username}))
            .setDescription(description),
    );
  }

}

global.error = MessageError.error;
