import {format, Replacements} from "./utils/StringFormatter";
import {RandomUtils} from "./utils/RandomUtils";
import {JsonModule} from "./Data";

declare const JsonReader: JsonModule;

const translationModulesCache: Record<string, TranslationModule> = {};

export class TranslationModule {
	private readonly _module: string;

	private readonly _language: string;

	private readonly _moduleTranslationObject: JsonModule;

	constructor(module: string, language: string) {
		this._module = module;
		this._moduleTranslationObject = TranslationModule.getTranslationObject(module.split("."), language);
		this._language = language;
	}

	get language(): string {
		return this._language;
	}

	private static getTranslationObject(modulePath: string[], language: string): JsonModule {
		let lastObject: JsonModule = JsonReader;
		for (const path of modulePath) {
			if (!(path in lastObject)) {
				return null;
			}
			lastObject = lastObject[path] as JsonModule;
		}
		if (!("translations" in lastObject)) {
			return null;
		}
		lastObject = lastObject.translations as JsonModule;
		if (!(language in lastObject)) {
			return null;
		}
		return lastObject[language] as JsonModule;
	}

	format(translation: string, replacements: Replacements): string {
		return format(this.get(translation), replacements);
	}

	get(translation: string): string {
		return this.getTranslationObject(translation) as string;
	}

	getFromArray(translation: string, index: number): string {
		const array = this.getTranslationObject(translation);
		if (array && Array.isArray(array)) {
			if (index >= array.length) {
				console.warn(`Trying to use an invalid translation array index: ${index} with translation ${translation} in module ${this._module}`);
				return "ERR:ARRAY_OUT_OF_BOUND";
			}
			return array[index];
		}
		console.warn(`Trying to use an invalid translation array: ${translation} in module ${this._module}`);
		return "ERR:NOT_AN_ARRAY";
	}

	getRandom(translation: string): string {
		return RandomUtils.draftbotRandom.pick(this.getTranslationObject(translation) as unknown as string[]);
	}

	public getObject(translation: string): JsonModule[] {
		return this.getTranslationObject(translation) as unknown as JsonModule[];
	}

	getObjectSize(translation: string): number {
		const object = this.getTranslationObject(translation);
		if (typeof object === "object") {
			return Object.keys(object).length;
		}
		console.warn(`Trying to use an invalid translation object: ${translation} in module ${this._module}`);
		return 0;
	}

	public getKeys(translation: string): string[] {
		return Object.keys(this.getTranslationObject(translation));
	}

	private getTranslationObject(translation: string): JsonModule | string {
		if (!this._moduleTranslationObject) {
			console.warn(`Trying to use an invalid translation module: ${this._module}`);
			return "ERR:MODULE_NOT_FOUND";
		}
		const translationPath = translation.split(".");
		let lastObject = this._moduleTranslationObject;
		for (const path of translationPath) {
			if (!(path in lastObject)) {
				console.warn(`Trying to use an invalid translation: ${path} in module ${this._module}`);
				return "ERR:TRANSLATION_NOT_FOUND";
			}
			lastObject = lastObject[path] as JsonModule;
		}
		return lastObject;
	}
}

export class Translations {
	static getModule(module: string, language: string): TranslationModule {
		const moduleKey = module + language;
		if (translationModulesCache[moduleKey]) {
			return translationModulesCache[moduleKey];
		}
		const translationModule = new TranslationModule(module, language);
		translationModulesCache[moduleKey] = translationModule;
		return translationModule;
	}

	static getSubModules(module: string): string[] {
		return Object.keys(JsonReader);
	}
}

const getDeepKeys = function(obj: JsonModule): string[] {
	let keys: string[] = [];
	for (const key of Object.keys(obj)) {
		keys.push(key);
		if (typeof obj[key] === "object") {
			const subKeys = getDeepKeys(obj[key] as JsonModule);
			keys = keys.concat(subKeys.map(function(subKeys) {
				return `${key}.${subKeys}`;
			}));
		}
	}
	return keys;
};

const checkMissing = function(obj: JsonModule, name: string): void {
	if (!obj || typeof obj !== "object" && typeof obj !== "function") {
		return;
	}
	if (obj.translations) {
		const {en, fr} = obj.translations as JsonModule;
		if (fr && !en) {
			console.warn(`${name}: Missing en object translation`);
			return;
		}
		if (!fr && en) {
			console.warn(`${name}: Missing fr object translation`);
			return;
		}
		const keysFr = getDeepKeys(fr as JsonModule);
		const keysEn = getDeepKeys(en as JsonModule);
		const differencesEn = keysFr.filter(key => keysEn.indexOf(key) === -1);
		const differencesFr = keysEn.filter(key => keysFr.indexOf(key) === -1);
		for (const diff of differencesEn) {
			console.warn(`${name}: "${diff}" is present in french but not in english`);
		}
		for (const diff of differencesFr) {
			console.warn(`${name}: "${diff}" is present in english but not in french`);
		}
	}
	else {
		for (const key of Object.keys(obj)) {
			checkMissing(obj[key] as JsonModule, name === "" ? key : `${name}.${key}`);
		}
	}
};

export const checkMissingTranslations = function(): void {
	checkMissing(JsonReader, "");
};