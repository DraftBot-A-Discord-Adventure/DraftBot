const ServerManager = require('../../classes/ServerManager');

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const changePrefixCommand = async function (message, args) {
    if (message.member.hasPermission("ADMINISTRATOR")) { 
        let serverId = message.guild.id
        let newPrefix = args[1];
        let serverManager = new ServerManager();
        let server = await serverManager.getServerById(serverId);
        server.prefix = newPrefix;
        serverManager.updateServer(server);
        message.channel.send(":white_check_mark: Le serveur d'id : " + serverId + " a désormais pour préfix : " + newPrefix);
    }else{
        message.channel.send(":x: Vous n'avez pas la permission `Administrateur` sur ce serveur. Cette dernière est necessaire pour changer le préfix du bot !");
    }
};




module.exports.ChangePrefixCommand = changePrefixCommand;


