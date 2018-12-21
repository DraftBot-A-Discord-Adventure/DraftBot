/**
 * This will send the contents of reply in the channel the parameter message was posted in.
 * @param message - The message to reply to. Used to get the channel to post in.
 * @param reply - The reply to post.
 */
const replyToMessage = function(message, reply) {
    message.channel.send(reply);
};

module.exports.replyToMessage = replyToMessage;