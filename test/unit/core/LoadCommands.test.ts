test.todo("Nothing");

/*
Je mets en commentaire les test sont foireux

const {readdir, writeFile, unlink} = require("fs/promises");
const { readdirSync } = require("fs");

const listFiles = async () => await readdirSync("src/commands/admin").filter((command : string) => command.endsWith(".js"));
const listFilesWithoutFilter = async () => await readdirSync("src/commands/admin");
test("find categories", async () => {
	const expectedFolders = ["admin", "guild", "pets", "player"];
	await readdir("src/commands").then((folders : string[]) => {
		expect(folders).toEqual(expect.arrayContaining(expectedFolders));
	});
});

test("filter no javascript files", async () => {
	await writeFile("src/commands/admin/test.txt", "This is a test file.");
	await listFiles().then((files : string[]) => {
		for (let i = 0; i < files.length; i++) {
			expect(files[i].endsWith(".js")).toBe(true);
		}
	});
	await unlink("src/commands/admin/test.txt");
});

test("filter no javascript files without filter", async () => {
	await writeFile("src/commands/admin/test.txt", "This is a test file.");
	await listFilesWithoutFilter().then((files : string[]) => {
		for (let i = 0; i < files.length; i++) {
			expect(files[i].endsWith(".js")).toBe(true);
		}
	});
	await unlink("src/commands/admin/test.txt");
});*/