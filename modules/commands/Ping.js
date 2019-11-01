const ServerManager = require('../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    console.log(server)
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Display the ping of the bot and allow user to check if the bot is online
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message
 */
const pingCommand = async function (message) {
    Text = await chargeText(message);
    let pingMessage = Text.commands.ping.main;
    displayPing(message, pingMessage);

};


/**
 * Display the latency of the bot.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message
 * @param pingMessage - The text used to make the answer more beautiful
 */
function displayPing(message, pingMessage) {

    message.channel.send(pingMessage).then(msg => {
        let pingValue = calculateTimeDifferenceBetweenTwoMessages(message, msg);
        msg.edit(pingMessage + " | " + pingValue + " ms");
    })

}


/**
 * calculate the time difference between two messages
 * @param messageOne - The first message
 * @param messageTwo - The second message
 */
function calculateTimeDifferenceBetweenTwoMessages(messageOne, messageTwo) {

    let startTime = messageOne.createdTimestamp;
    let endTime = messageTwo.createdTimestamp;
    let pingValue = endTime - startTime;
    return pingValue;

}

module.exports.PingCommand = pingCommand;