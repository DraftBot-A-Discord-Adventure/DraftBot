declare const JsonReader: any;

const translationModulesCache: Record<string, TranslationModule> = {};

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

	get(translation: string): string {
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