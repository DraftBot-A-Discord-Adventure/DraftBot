import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import rule from "../../../eslint-custom-rules/no-unsaved-player-before-mission-update.mjs";

const options = [
	{
		playerMutators: ["addEnergy"],
		playerReloaders: ["addMoney", "addExperience"],
		nonPlayerReceiver: "[Gg]uild$"
	}
];

const unsavedPlayer = [{ messageId: "unsavedPlayer" }];

function inFunction(body: string): string {
	return `async function f(player, guild, guildChief, guildLike, x, list) { ${body} }`;
}

new RuleTester({ languageOptions: { parser } }).run("no-unsaved-player-before-mission-update", rule, {
	valid: [
		"player.class = 2; await player.save(); await player.addMoney({});",
		"await player.addMoney({}); player.class = 2;",
		"const later = () => { player.class = 2; }; await player.addMoney({});",
		"guild.treasury -= 1; await guild.addExperience({});",
		"guildLike.guild.score = 1; await guildLike.guild.addExperience({});",
		"if (x) { player.class = 2; } else { await player.addMoney({}); }",
		"switch (x) { case 0: player.class = 2; break; case 1: await player.addMoney({}); }",
		"switch (x) { case 0: { player.class = 2; return; } case 1: await MissionsController.update(player, [], {}); }"
	].map(body => ({
		code: inFunction(body), options
	})),
	invalid: [
		"player.class = 2; await player.addMoney({});",
		"player.addEnergy(1); await player.addMoney({});",
		"player.class = 2; await MissionsController.update(player, [], {});",
		"guildChief.class = 2; await guildChief.addMoney({});",
		"if (x) { player.class = 2; } await player.addMoney({});",
		"switch (x) { case 0: player.class = 2; case 1: await player.addMoney({}); }",
		"switch (x) { case 0: player.class = 2; case 1: await MissionsController.update(player, [], {}); }",
		"for (const y of list) { if (y) { player.class = 2; } else { await player.addMoney({}); } }",
		"while (x) { switch (x) { case 0: player.class = 2; break; case 1: await player.addMoney({}); } }"
	].map(body => ({
		code: inFunction(body), options, errors: unsavedPlayer
	}))
});
