import {format, Replacements} from "./utils/StringFormatter";
import {Random} from "random-js";

declare const JsonReader: any;

const translationModulesCache: Record<string, TranslationModule> = {};
declare const draftbotRandom: Random;

export class TranslationModule {
	private readonly _module: string;

	private readonly _language: string;

	private readonly _moduleTranslationObject: any;

	constructor(module: string, language: string) {
		this._module = module;
		this._moduleTranslationObject = TranslationModule.getTranslationObject(module.split("."), language);
		this._language = language;
	}

	private static getTranslationObject(modulePath: string[], language: string): any {
		let lastObject = JsonReader;
		for (const path of modulePath) {
			if (!(path in lastObject)) {
				return null;
			}
			lastObject = lastObject[path];
		}
		if (!("translations" in lastObject)) {
			return null;
		}
		lastObject = lastObject.translations;
		if (!(language in lastObject)) {
			return null;
		}
		return lastObject[language];
	}

	get language(): string {
		return this._language;
	}

	private getTranslationObject(translation: string): unknown {
		if (!this._moduleTranslationObject) {
			console.warn("Trying to use an invalid translation module: " + this._module);
			return "ERR:MODULE_NOT_FOUND";
		}
		const translationPath = translation.split(".");
		let lastObject = this._moduleTranslationObject;
		for (const path of translationPath) {
			if (!(path in lastObject)) {
				console.warn("Trying to use an invalid translation: " + path + " in module " + this._module);
				return "ERR:TRANSLATION_NOT_FOUND";
			}
			lastObject = lastObject[path];
		}
		return lastObject;
	}

	format(translation: string, replacements: Replacements) {
		return format(this.get(translation), replacements);
	}

	get(translation: string): string {
		return <string> this.getTranslationObject(translation);
	}

	getFromArray(translation: string, index: number): string {
		const array = this.getTranslationObject(translation);
		if (array && Array.isArray(array)) {
			if (index >= array.length) {
				console.warn("Trying to use an invalid translation array index: " + index + " with translation " + translation + " in module " + this._module);
				return "ERR:ARRAY_OUT_OF_BOUND";
			}
			return array[index];
		}
		console.warn("Trying to use an invalid translation array: " + translation + " in module " + this._module);
		return "ERR:NOT_AN_ARRAY";
	}

	getRandom(translation: string): string {
		return draftbotRandom.pick(<string[]> this.getTranslationObject(translation));
	}

	public getObject(translation: string): any[] {
		return <any[]> this.getTranslationObject(translation);
	}

	getObjectSize(translation: string): number {
		const object = this.getTranslationObject(translation);
		if (typeof object === "object") {
			return Object.keys(object).length;
		}
		console.warn("Trying to use an invalid translation object: " + translation + " in module " + this._module);
		return 0;
	}

	public getKeys(translation: string): string[] {
		return Object.keys(this.getTranslationObject(translation));
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
}

const getDeepKeys = function(obj: any): string[] {
	let keys: string[] = [];
	for (const key of Object.keys(obj)) {
		keys.push(key);
		if (typeof obj[key] === "object") {
			const subKeys = getDeepKeys(obj[key]);
			keys = keys.concat(subKeys.map(function(subKeys) {
				return key + "." + subKeys;
			}));
		}
	}
	return keys;
};

const checkMissing = function(obj: any, name: string) {
	if (!obj || typeof obj !== "object" && typeof obj !== "function") {
		return;
	}
	if (obj.translations) {
		if (obj.translations.fr && !obj.translations.en) {
			console.warn(name + ": Missing en object translation");
			return;
		}
		if (!obj.translations.fr && obj.translations.en) {
			console.warn(name + ": Missing fr object translation");
			return;
		}
		const keysFr = getDeepKeys(obj.translations.fr);
		const keysEn = getDeepKeys(obj.translations.en);
		const differencesEn = keysFr.filter(key => keysEn.indexOf(key) === -1);
		const differencesFr = keysEn.filter(key => keysFr.indexOf(key) === -1);
		for (const diff of differencesEn) {
			console.warn(name + ": \"" + diff + "\" is present in french but not in english");
		}
		for (const diff of differencesFr) {
			console.warn(name + ": \"" + diff + "\" is present in english but not in french");
		}
	}
	else {
		for (const key of Object.keys(obj)) {
			checkMissing(obj[key], name === "" ? key : name + "." + key);
		}
	}
};

export const checkMissingTranslations = function(): void {
	checkMissing(JsonReader, "");
};