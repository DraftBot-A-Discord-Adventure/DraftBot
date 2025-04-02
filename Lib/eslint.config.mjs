// @ts-check

const {defineConfig} = require("eslint/config");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");
const jsdoc = require("eslint-plugin-jsdoc");
import stylistic from "@stylistic/eslint-plugin";
import customRules from "../eslint-rules.mjs";

module.exports = defineConfig([
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			parser: typescriptEslintParser,
			parserOptions: {
				ecmaVersion: 2022
			}
		},
		files: ["src/**/*.ts"],
		plugins: {
			"@typescript-eslint": typescriptEslintPlugin,
			jsdoc,
			"@stylistic": stylistic
		},
	},
	{
		rules: typescriptEslintPlugin.configs.recommended.rules
	},
	{
		rules: customRules
	}
]);
