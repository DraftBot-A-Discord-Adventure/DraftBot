const Tools = require("../../../src/core/Tools");
const stringTestsTab = [
	{text: "", isMention: false, isEmoji: false},
	{text: "fneaoindoandozandio", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false},
	{text: "", isMention: false, isEmoji: false}
];
test("tests on strings", () => {
	stringTestsTab.forEach(line => {
		expect(Tools.isAMention(line.text)).toBe(line.isMention);
		expect(Tools.isAnEmoji(line.text)).toBe(line.isEmoji);
	})
});