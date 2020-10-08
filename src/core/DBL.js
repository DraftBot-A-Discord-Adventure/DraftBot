const DiscordBotList = require('dblapi.js');

class DBL {
  static dbl;

  static startDBLWebhook() {
    if (JsonReader.app.DBL_WEBHOOK_URL === "" || JsonReader.app.DBL_WEBHOOK_PORT === 0 || !JsonReader.app.DBL_WEBHOOK_PASSWORD || JsonReader.app.DBL_WEBHOOK_PASSWORD === "" || !JsonReader.app.DBL_TOKEN || JsonReader.app.DBL_TOKEN === "") {
      console.info("DBL Webhook not configured, skipped.");
      return;
    }
    this.dbl = new DiscordBotList(JsonReader.app.DBL_TOKEN, { webhookPort: JsonReader.app.DBL_WEBHOOK_PORT, webhookPath: JsonReader.app.DBL_WEBHOOK_URL, webhookAuth: JsonReader.app.DBL_WEBHOOK_PASSWORD });
    this.dbl.webhook.on('vote', async (vote) => {
      await DBL.userDBLVote(vote.user);
    });
    this.dbl.on('ready', () => {
      console.log(`Webhook running at http://${this.dbl.webhook.hostname}:${this.dbl.webhook.port}${this.dbl.webhook.path}`);
      setInterval(() => {
        //this.dbl.postStats(discord.guilds.size);
      }, TOPGG.DBL_SERVER_COUNT_UPDATE_TIME);
    });
    this.dbl.on('error', e => {
      console.log(`DBL Error: ${e}`);
    });
    this.dbl.on('posted', () => {
      console.log('Successfully posted ' + discord.guilds.size + ' servers to DBL');
    });
  }

  /**
   * Make the user vote
   * @param {string} user - The id
   * @returns {Promise<void>}
   */
  static async userDBLVote(user) {
    let [voter] = await Entities.getOrRegister(user);
    voter.Player.topggVoteAt = new Date();
    voter.Player.save();
    let guild = await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID);
    let member;
    if ((member = await guild.members.fetch(user)) !== undefined) {
      try {
        await member.roles.add(JsonReader.app.DBL_VOTE_ROLE);
        await DBL.programDBLRoleRemoval(user);
      } catch (e) {
        console.log(e);
      }
    }
    let dUser = await client.users.fetch(user);
    if (dUser === undefined || dUser === null) {
      return;
    }
    const embed = new discord.MessageEmbed();
    embed.setAuthor("Thank you for voting for " + client.user.username, dUser.avatarURL(), "https://top.gg/bot/" + client.user.id);
    let desc = "User: `" + dUser.tag + " (id:" + dUser.id + ")` just voted!\n" + dUser.username + " got the role `" + (await guild.roles.fetch(JsonReader.app.DBL_VOTE_ROLE)).name + "` for `";
    if (TOPGG.ROLE_DURATION === 24) {
      desc += "1 day";
    } else {
      desc += TOPGG.ROLE_DURATION + " hours";
    }
    embed.setDescription(desc + "` and the badge " + TOPGG.BADGE + " for `" + TOPGG.BADGE_DURATION + " hours` :tada:"
      + "\n\nYou can vote [here](https://top.gg/bot/" + client.user.id + ") every 12 hours!"
    );
    embed.setFooter("Thank you for your support!");
    (await guild.channels.cache.get(JsonReader.app.DBL_LOGS_CHANNEL)).send(embed);
  }

  /**
   * @param {string} userId
   * @returns {Promise<number>} - time in ms, can be negative if the time already passed
   */
  static async getTimeBeforeDBLRoleRemove(userId) {
    let [user] = await Entities.getOrRegister(userId);
    if (user === undefined || user === null) {
      return -1;
    }
    return user.Player.topggVoteAt.getTime() + TOPGG.ROLE_DURATION * 60 * 60 * 1000 - new Date();
  }

  static async programDBLRoleRemoval(userId) {
    let time = await DBL.getTimeBeforeDBLRoleRemove(userId);
    setTimeout(DBL.removeDBLRole.bind(null, userId), time < 0 ? 0 : time);
  }

  static async removeDBLRole(userId) {
    let [entity] = await Entities.getOrRegister(userId);
    if (new Date().getTime() - entity.Player.topggVoteAt.getTime() < TOPGG.ROLE_DURATION * 60 * 60 * 1000 - 10000) {
      return;
    }
    let member = await (await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID)).members.fetch(userId);
    try {
      await member.roles.remove(JsonReader.app.DBL_VOTE_ROLE);
    } catch (e) {
      console.log(e);
    }
  }

  static async verifyDBLRoles() {
    let guild = await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID);
    let members = guild.members.cache.entries();
    for (const member of members) {
      if (member[1].roles.cache.has(JsonReader.app.DBL_VOTE_ROLE)) {
        await DBL.programDBLRoleRemoval(member[1].id);
      }
    }
  }
}

module.exports = {
  startDBLWebhook: DBL.startDBLWebhook,
  verifyDBLRoles: DBL.verifyDBLRoles,
  userDBLVote: DBL.userDBLVote
};