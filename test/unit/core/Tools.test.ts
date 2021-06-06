require("../../../src/core/Tools.js");

test("id to mention", () => {
	expect(idToMention(123456789)).toBe("<@&123456789>");
});
