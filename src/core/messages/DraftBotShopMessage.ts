import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {Translations} from "../Translations";
import {Constants} from "../Constants";

declare function format(s: string, replacement: any): string;

export class DraftBotShopMessage extends DraftBotReactionMessage {

	private readonly _getUserMoney: (userId: string) => number;

	private readonly _userId: string;

	constructor(
		shopItemCategories: ShopItemCategory[],
		language: string,
		title: string,
		userId: string,
		currentMoney: number,
		getUserMoney: (userId: string) => number
	) {
		const translationModule = Translations.getModule("commands.shop", language);
		const reactions: DraftBotReaction[] = [];
		let content = "";
		for (const shopItemCategory of shopItemCategories) {
			content += "**" + shopItemCategory.categoryTitle + " :**\n";
			for (const shopItem of shopItemCategory.items) {
				content += format(translationModule.get("display"), {
					emote: shopItem.emote,
					name: shopItem.name,
					price: shopItem.price
				}) + "\n";
				reactions.push(new DraftBotReaction(shopItem.emote));
			}
			content += "\n";
		}
		content += format(translationModule.get("moneyQuantity"), {
			money: currentMoney
		});
		super(
			reactions,
			[userId],
			DraftBotShopMessage.shopCallback,
			1,
			false,
			0
		);
		this.setTitle(title);
		this.setDescription(content);
		this._getUserMoney = getUserMoney;
	}

	getUserMoney(): number {
		return this._getUserMoney(this._userId);
	}

	private static async shopCallback(msg: DraftBotReactionMessage): Promise<void> {
		if (msg.getFirstReaction()) {
			const shopMessage = msg as DraftBotShopMessage;
			const userMoney = await shopMessage.getUserMoney();
			/* if (userMoney < shopMessage.) TODO */
		}
	}
}

export class DraftBotShopMessageBuilder {
	private _shopItemCategories: ShopItemCategory[] = [];

	private readonly _userId: string;

	private readonly _title: string;

	private readonly _language: string;

	private readonly _getUserMoney: (userId: string) => number;

	private _noShoppingCart = false;

	constructor(userId: string, title: string, language: string, getUserMoney: (userId: string) => number) {
		this._userId = userId;
		this._title = title;
		this._language = language;
		this._getUserMoney = getUserMoney;
	}

	addCategory(category: ShopItemCategory): DraftBotShopMessageBuilder {
		this._shopItemCategories.push(category);
		return this;
	}

	noShoppingCart(): DraftBotShopMessageBuilder {
		this._noShoppingCart = true;
		return this;
	}

	async build(): Promise<DraftBotShopMessage> {
		return new DraftBotShopMessage(
			this._shopItemCategories,
			this._language,
			(this._noShoppingCart ? this._title : Constants.REACTIONS.SHOPPING_CART + " " + this._title) + " :",
			this._userId,
			await this._getUserMoney(this._userId),
			this._getUserMoney
		);
	}
}

export class ShopItem {
	private readonly _emote: string;

	private readonly _name: string;

	private readonly _price: number;

	constructor(emote: string, name: string, price: number) {
		this._emote = emote;
		this._name = name;
		this._price = price;
	}

	get emote(): string {
		return this._emote;
	}

	get name(): string {
		return this._name;
	}

	get price(): number {
		return this._price;
	}
}

export class ShopItemCategory {
	private readonly _items: ShopItem[];

	private readonly _categoryTitle: string;

	constructor(items: ShopItem[], categoryTitle: string) {
		this._items = items;
		this._categoryTitle = categoryTitle;
	}

	get items(): ShopItem[] {
		return this._items;
	}

	get categoryTitle(): string {
		return this._categoryTitle;
	}
}