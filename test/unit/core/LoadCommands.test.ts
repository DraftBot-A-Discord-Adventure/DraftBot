const {readdirSync} = require("fs");

const findCategories = async () => await readdirSync("src/commands");

test("find categories", async () => {
	const expectedFolders = ["admin", "guild", "pets", "player"];
	await findCategories().then((folders : string[]) => {
		expect(folders).toEqual(expect.arrayContaining(expectedFolders));
	});
});
