import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";

export class DraftBotListChoiceMessage extends DraftBotReactionMessage {
	constructor(items: ChoiceItem[], userId: string, callback: (item: unknown) => void | Promise<void>, cancelCallback: (msg: DraftBotListChoiceMessage) => void | Promise<void>) {
		const reactions: DraftBotReaction[] = [];
		const callbackToCall = callback as (item: unknown) => Promise<void>;
		const cancelCallbackToCall = cancelCallback as (msg: DraftBotListChoiceMessage) => Promise<void>;
		let desc = "";
		for (let i = 0; i < 10 && i < items.length; ++i) {
			reactions.push(new DraftBotReaction(
				Constants.REACTIONS.NUMBERS[i + 1],
				() => {
					callbackToCall(items[i].item).then(() => null, () => null);
					this.collector.stop();
				}
			));
			desc += `${Constants.REACTIONS.NUMBERS[i + 1]} - ${items[i].name}\n`;
		}
		reactions.push(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
		super(reactions, [userId], cancelCallbackToCall, 0, false, 0);
		this.setDescription(desc);
	}

	public isCanceled(): boolean {
		return !this.collector.collected.first() || !Constants.REACTIONS.NUMBERS.includes(this.collector.collected.first().emoji.name);
	}
}

export class ChoiceItem {
	private readonly _name: string;

	private readonly _item: unknown;

	constructor(name: string, item: unknown) {
		this._name = name;
		this._item = item;
	}

	get name(): string {
		return this._name;
	}

	get item(): unknown {
		return this._item;
	}
}