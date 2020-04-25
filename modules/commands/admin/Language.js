const ServerManager = require('../../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    let address = '../../text/' + server.language;
    return require(address);
}


/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const changeLanguageCommand = async function (message, args) {
    if (message.member.hasPermission("ADMINISTRATOR")) {
        let serverId = message.guild.id
        let serverManager = new ServerManager();
        let server = await serverManager.getServerById(serverId);
        if(server.language == "fr"){
            server.language = "en";
            message.channel.send(":flag_gb: | Draftbot will now speak in english on this server!");
        }else{
            server.language = "fr";
            message.channel.send(":flag_fr: | Draftbot va désormais parler français sur ce serveur !");
        }
        console.log("Changement de langue effectué sur le serveur : " + server)
        serverManager.updateServer(server);
    }else{
        Text = await chargeText(message);
        message.channel.send(Text.commands.admin.error);
    }
};




module.exports.ChangeLanguageCommand = changeLanguageCommand;


