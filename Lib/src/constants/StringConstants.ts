export class Sex {
	readonly short: string;

	readonly long: string;

	constructor(short: string, long: string) {
		this.short = short;
		this.long = long;
	}
}

export class StringConstants {
	static readonly PROGRESS_BAR_SIZE = 20;

	static readonly SEX = {
		MALE: new Sex("m", "male"),
		FEMALE: new Sex("f", "female")
	};
}
