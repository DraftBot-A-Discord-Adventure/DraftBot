import {IMission} from "./IMission";

export class MissionTag implements IMission {

	public tagNames!: string[];

	constructor(tagsToProc: string[]) {
		this.tagNames = tagsToProc;
	}

	areParamsMatchingVariant(variant: number, params: { [p: string]: any }): boolean {
		for (const tag in this.tagNames) {
			if (tag in params.tags) {
				return true;
			}
		}
		return false;
	}

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	}

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	}

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	}

}