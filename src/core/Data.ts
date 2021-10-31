declare const JsonReader: any;

const dataModulesCache: Record<string, DataModule> = {};

export class DataModule {
	private readonly _module: string;

	private readonly _moduleDataObject: any;

	constructor(module: string) {
		this._module = module;
		this._moduleDataObject = DataModule.getDataObject(module.split("."));
	}

	private static getDataObject(modulePath: string[]): any {
		let lastObject = JsonReader;
		for (const path of modulePath) {
			if (!(path in lastObject)) {
				return null;
			}
			lastObject = lastObject[path];
		}
		return lastObject;
	}

	private getDataObject(path: string, warn = true): unknown {
		if (!this._moduleDataObject) {
			if (warn) {
				console.warn("Trying to use an invalid data module: " + this._module);
			}
			return null;
		}
		const dataPath = path.split(".");
		let lastObject = this._moduleDataObject;
		for (const pathSplit of dataPath) {
			if (!(pathSplit in lastObject)) {
				if (warn) {
					console.warn("Trying to use an invalid data: " + path + " in module " + this._module);
				}
				return null;
			}
			lastObject = lastObject[pathSplit];
		}
		return lastObject;
	}

	public getString(path: string): string {
		return <string> this.getDataObject(path);
	}

	public getNumber(path: string): number {
		return <number> this.getDataObject(path);
	}

	public getBoolean(path: string): boolean {
		return <boolean> this.getDataObject(path);
	}

	public getStringFromArray(path: string, index: number): string {
		return (<string[]> this.getDataObject(path))[index];
	}

	public getNumberFromArray(path: string, index: number): number {
		return (<number[]> this.getDataObject(path))[index];
	}

	public getBooleanFromArray(path: string, index: number): boolean {
		return (<boolean[]> this.getDataObject(path))[index];
	}

	public exists(path: string): boolean {
		const dataObj = this.getDataObject(path, false);
		return dataObj !== null && dataObj !== undefined;
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
}