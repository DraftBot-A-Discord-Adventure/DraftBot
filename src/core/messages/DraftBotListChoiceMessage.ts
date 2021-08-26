import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";

export class DraftBotListChoiceMessage extends DraftBotReactionMessage {
	constructor(items: ChoiceItem[], userId: string, callback: (item: any) => void, cancelCallback: (msg: DraftBotReactionMessage) => void) {
		const reactions: DraftBotReaction[] = [];
		let desc = "";
		for (let i = 0; i < 10 && i < items.length; ++i) {
			reactions.push(new DraftBotReaction(
				Constants.REACTIONS.NUMBERS[i + 1],
				() => {
					callback(items[i].item);
					this.collector.stop();
				}
			));
			desc += Constants.REACTIONS.NUMBERS[i + 1] + " - " + items[i].name + "\n";
		}
		reactions.push(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
		super(reactions, [userId], cancelCallback, 0, false, 0);
		this.setDescription(desc);
	}

	public isCancelled(): boolean {
		return !this.collector.collected.first() || !Constants.REACTIONS.NUMBERS.includes(this.collector.collected.first().emoji.name);
	}
}

export class ChoiceItem {
	private readonly _name: string;

	private readonly _item: any;

	constructor(name: string, item: any) {
		this._name = name;
		this._item = item;
	}

	get name(): string {
		return this._name;
	}

	get item(): any {
		return this._item;
	}
}