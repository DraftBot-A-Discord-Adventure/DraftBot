export class FighterStatus {
	static readonly NOT_STARTED = new FighterStatus("summarize.notStarted");

	static readonly NOT_STARTED_PLAYER = new FighterStatus("summarize.notStartedPlayer");

	static readonly ATTACKER = new FighterStatus("summarize.attacker");

	static readonly DEFENDER = new FighterStatus("summarize.defender");

	static readonly DONE = new FighterStatus("summarize.done");

	static readonly BUG = new FighterStatus("summarize.bug");


	private readonly translationField: string;

	constructor(translationField: string) {
		this.translationField = translationField;
	}
}
