import {
	DraftBotReactionMessage,
	DraftBotReactionMessageBuilder
} from "../../../../src/core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../../../../src/core/messages/DraftBotReaction";

const callbackTest1 = () => {
	// Do something
};
const endCallback = (msg: DraftBotReactionMessage) => {
	if (msg.getFirstReaction()) {
		// Bla bla
	}
};
const draftBotReactionMessage = new DraftBotReactionMessageBuilder()
	.addReaction(new DraftBotReaction("test1", callbackTest1))
	.addReaction(new DraftBotReaction("test2"))
	.allowUserId("user id")
	.endCallback(endCallback)
	.build()
	.setTitle("Test title")
	.setDescription("Test description");

test("build should return an instance of message", () => {
	expect(draftBotReactionMessage).toBeInstanceOf(DraftBotReactionMessage);
});

test("should throw an error when stop is called before send", () => {
	expect(() => {
		draftBotReactionMessage.stop();
	}).toThrow();
});

test("should throw an error when get first reaction is called before send", () => {
	expect(() => {
		draftBotReactionMessage.getFirstReaction();
	}).toThrow();
});