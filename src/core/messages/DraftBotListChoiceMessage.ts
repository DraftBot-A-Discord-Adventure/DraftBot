import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";

type itemObject = { name: string, frenchMasculine: boolean, value: number, slot: number, itemCategory: number };

export class DraftBotListChoiceMessage extends DraftBotReactionMessage {
	constructor(items: ChoiceItem[], userId: string, callback: (item: itemObject) => void | Promise<void>, cancelCallback: (msg: DraftBotListChoiceMessage) => void) {
		const reactions: DraftBotReaction[] = [];
		const callbackToCall = callback as (item: itemObject) => Promise<void>;
		let desc = "";
		for (let i = 0; i < 10 && i < items.length; ++i) {
			reactions.push(new DraftBotReaction(
				Constants.REACTIONS.NUMBERS[i + 1],
				() => {
					callbackToCall(items[i].item).then(() => null, () => null);
					this.collector.stop();
				}
			));
			desc += Constants.REACTIONS.NUMBERS[i + 1] + " - " + items[i].name + "\n";
		}
		reactions.push(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
		super(reactions, [userId], cancelCallback, 0, false, 0);
		this.setDescription(desc);
	}

	public isCanceled(): boolean {
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