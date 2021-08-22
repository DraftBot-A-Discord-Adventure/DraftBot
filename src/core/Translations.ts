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