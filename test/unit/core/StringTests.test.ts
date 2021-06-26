const Tools = require("../../../src/core/Tools");
const stringTestsTab = [
	{text: "", isMention: false, isEmoji: false},
	{text: "fneaoindoandozandio", isMention: false, isEmoji: false},
	{text: "�", isMention: false, isEmoji: false},
	{text: "<@!238555869208510465>", isMention: true, isEmoji: false},
	{text: "<@!238555869208510465><@!238555869208510465>", isMention: false, isEmoji: false},
	{text: "�<@!238555869208510465>", isMention: false, isEmoji: false},
	{text: "⭐", isMention: false, isEmoji: true},
	{text: "�‍�‍�", isMention: false, isEmoji: true},
	{text: "�‍�", isMention: false, isEmoji: true},
	{text: "✒️", isMention: false, isEmoji: true}
];
test("tests on strings", () => {
	stringTestsTab.forEach(line => {
		console.log(line);
		expect(Tools.isAMention(line.text)).toBe(line.isMention);
		expect(Tools.isAnEmoji(line.text)).toBe(line.isEmoji);
	})
});