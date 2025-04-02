// @ts-check

const {defineConfig, globalIgnores} = require("eslint/config");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");
const jsdoc = require("eslint-plugin-jsdoc");

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
			jsdoc
		}
	},
	{
		rules: typescriptEslintPlugin.configs.recommended.rules
	},
	{
		rules: require("../eslint-rules.json")
	},
	globalIgnores(["src/@types/**/*.ts"])
]);
