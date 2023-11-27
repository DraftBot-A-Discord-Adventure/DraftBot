export class Constants {
	static readonly VERSION = import("../package.json").then(json => json.version);

	static readonly MAX_TIME_BOT_RESPONSE = 30000;
}