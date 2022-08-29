import {RandomUtils} from "./utils/RandomUtils";

type JsonModuleAvailableTypes = JsonModule | unknown | unknown[];
export type JsonModule = { [key: string]: JsonModuleAvailableTypes }

declare const JsonReader: JsonModule;

const dataModulesCache: Record<string, DataModule> = {};

export class DataModule {
	private readonly _module: string;

	private readonly _moduleDataObject: JsonModule;

	constructor(module: string) {
		this._module = module;
		this._moduleDataObject = DataModule.getDataObject(module.split("."));
	}

	private static getDataObject(modulePath: string[]): JsonModule {
		let lastObject = JsonReader;
		for (const path of modulePath) {
			if (!(path in lastObject)) {
				return null;
			}
			lastObject = lastObject[path] as JsonModule;
		}
		return lastObject;
	}

	public getString(path: string): string {
		return this.getDataObject(path) as string;
	}

	public getNumber(path: string): number {
		return this.getDataObject(path) as number;
	}

	public getBoolean(path: string): boolean {
		return this.getDataObject(path) as boolean;
	}

	public getStringFromArray(path: string, index: number): string {
		return (this.getDataObject(path) as string[])[index];
	}

	public getNumberFromArray(path: string, index: number): number {
		return (this.getDataObject(path) as number[])[index];
	}

	public getBooleanFromArray(path: string, index: number): boolean {
		return (this.getDataObject(path) as boolean[])[index];
	}

	public exists(path: string): boolean {
		const dataObj = this.getDataObject(path, false);
		return dataObj !== null && dataObj !== undefined;
	}

	public getRandomNumberFromArray(path: string): number {
		const dataObj = this.getDataObject(path, false);
		if (!dataObj) {
			return 0;
		}
		return RandomUtils.draftbotRandom.pick(dataObj as number[]);
	}

	public getRandomStringFromArray(path: string): string {
		const dataObj = this.getDataObject(path, false);
		if (!dataObj) {
			return "";
		}
		return RandomUtils.draftbotRandom.pick(dataObj as string[]);
	}

	public getListSize(path: string): number {
		return (this.getDataObject(path) as unknown[]).length;
	}

	public getObjectFromArray(path: string, index: number): JsonModule {
		return (this.getDataObject(path) as JsonModule[])[index];
	}

	public getObject(path: string): JsonModule {
		return this.getDataObject(path) as JsonModule;
	}

	public getStringArray(path: string): string[] {
		return this.getDataObject(path) as string[];
	}

	public getNumberArray(path: string): number[] {
		return this.getDataObject(path) as number[];
	}

	private getDataObject(path: string, warn = true): JsonModuleAvailableTypes {
		if (!this._moduleDataObject) {
			if (warn) {
				console.warn(`Trying to use an invalid data module: ${this._module}`);
			}
			return null;
		}
		const dataPath = path.split(".").values();
		dataPath.throw(-1);
		const end = path.split(".").at(-1);
		let lastObject = this._moduleDataObject;
		for (const pathSplit of dataPath) {
			if (!(pathSplit in lastObject)) {
				if (warn) {
					console.warn(`Trying to use an invalid data: ${path} in module ${this._module}`);
				}
				return null;
			}
			lastObject = lastObject[pathSplit] as JsonModule;
		}
		return lastObject[end];
	}
}

export class Data {
	static getModule(module: string): DataModule {
		const moduleKey = module;
		if (dataModulesCache[moduleKey]) {
			return dataModulesCache[moduleKey];
		}
		const dataModule = new DataModule(module);
		dataModulesCache[moduleKey] = dataModule;
		return dataModule;
	}

	static getKeys(path: string): string[] {
		return Object.keys(JsonReader[path]);
	}
}