// @ts-check

import {defineConfig, globalIgnores} from "eslint/config";
import * as rules from "../eslint-rules.json" with {type: "json"};

export default defineConfig([
	globalIgnores([
		"dist/",
		"src/core/utils/Astronomy.ts"
	]),
	{
		rules
	}
]);
