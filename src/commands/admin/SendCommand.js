/**
 * Allow an admin to send a dm to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SendCommand = async function (language, message, args) {
    message.delete();

    if ((await canPerformCommand(message, language,
        PERMISSION.ROLE.SUPPORT)) !== true) {
        return;
    }


    let playerId = args[0];
    let user = client.users.cache.get(playerId)
    let string = message.content.substr(message.content.indexOf(" ") + 2);
    let finalmessage = string.substr(string.indexOf(" ") + 1);
    finalmessage = finalmessage + "\n\n- " + message.author.username;
    await user.send(finalmessage).then(err => {
        message.channel.send(`:white_check_mark: | ` + JsonReader.commands.dm.getTranslation(language).dm_sent + user.username + "** :\n\n>>> " + finalmessage);
    }).catch(err => {
        message.channel.send(`:x: | ` + JsonReader.commands.dm.getTranslation(language).no_dm);
        console.log(err);
    });



};



module.exports = {
    'dm': SendCommand
};

