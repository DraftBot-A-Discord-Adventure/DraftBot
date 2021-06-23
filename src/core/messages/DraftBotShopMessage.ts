import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {TranslationModule, Translations} from "../Translations";
import {Constants} from "../Constants";
import {DMChannel, Message, MessageReaction, NewsChannel, TextChannel, User} from "discord.js";
import {DraftBotErrorEmbed} from "./DraftBotErrorEmbed";

declare function format(s: string, replacement: any): string;

export enum ShopEndReason {
	TIME,
	REACTION,
	NOT_ENOUGH_MONEY
}

export class DraftBotShopMessage extends DraftBotReactionMessage {

	private readonly _getUserMoney: (userId: string) => Promise<number>;

	private readonly _user: User;

	private readonly _removeUserMoney: (userId: string, amount: number) => Promise<void>;

	private readonly _shopEndCallback: (message: DraftBotShopMessage, reason: ShopEndReason) => void;

	private readonly _shopItems: ShopItem[];

	private readonly _shopItemReactions: string[];

	private readonly _language: string;

	private readonly _translationModule: TranslationModule;

	// eslint-disable-next-line max-params
	constructor(
		shopItemCategories: ShopItemCategory[],
		language: string,
		title: string,
		user: User,
		currentMoney: number,
		getUserMoney: (userId: string) => Promise<number>,
		removeUserMoney: (userId: string, amount: number) => Promise<void>,
		shopEndCallback: (message: DraftBotShopMessage, reason: ShopEndReason) => void
	) {
		const translationModule = Translations.getModule("commands.shop", language);
		const reactions: DraftBotReaction[] = [];
		const shopItems: ShopItem[] = [];
		const shopItemReactions: string[] = [];
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
				shopItems.push(shopItem);
				shopItemReactions.push(shopItem.emote);
			}
			content += "\n";
		}
		reactions.push(new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION));
		content += format(translationModule.get("moneyQuantity"), {
			money: currentMoney
		});
		super(
			reactions,
			[user.id],
			DraftBotShopMessage.shopCallback,
			0,
			false,
			0
		);
		this.setTitle(title);
		this.setDescription(content);
		this._getUserMoney = getUserMoney;
		this._user = user;
		this._removeUserMoney = removeUserMoney;
		this._shopEndCallback = shopEndCallback;
		this._shopItems = shopItems;
		this._shopItemReactions = shopItemReactions;
		this._language = language;
		this._translationModule = translationModule;
	}

	async getUserMoney(): Promise<number> {
		return await this._getUserMoney(this._user.id);
	}

	private getChoseShopItem(): ShopItem {
		const index: number = this._shopItemReactions.indexOf(this.getFirstReaction().emoji.name);
		if (index === -1) {
			return null;
		}
		return this._shopItems[index];
	}

	private static async shopCallback(msg: DraftBotReactionMessage): Promise<void> {
		const shopMessage = msg as DraftBotShopMessage;
		const choseShopItem = shopMessage.getChoseShopItem();
		if (choseShopItem) {
			const userMoney = await shopMessage.getUserMoney();
			if (userMoney < choseShopItem.price) {
				await shopMessage.sentMessage.channel.send(
					new DraftBotErrorEmbed(
						shopMessage._user,
						shopMessage._language,
						format(
							shopMessage._translationModule.get("error.cannotBuy"),
							{
								missingMoney: choseShopItem.price - userMoney
							}
						)
					)
				);
				shopMessage._shopEndCallback(shopMessage, ShopEndReason.NOT_ENOUGH_MONEY);
			}
			else {
				/* TODO buy confirmation */
			}
		}
		else if (msg.getFirstReaction()) {
			shopMessage._shopEndCallback(shopMessage, ShopEndReason.REACTION);
		}
		else {
			shopMessage._shopEndCallback(shopMessage, ShopEndReason.TIME);
		}
	}
}

export class DraftBotShopMessageBuilder {
	private _shopItemCategories: ShopItemCategory[] = [];

	private readonly _user: User;

	private readonly _title: string;

	private readonly _language: string;

	private readonly _getUserMoney: (userId: string) => Promise<number>;

	private readonly _removeUserMoney: (userId: string, amount: number) => Promise<void>;

	private _shopEndCallback: (message: DraftBotShopMessage, reason: ShopEndReason) => void = () => { /* do nothing */ };

	private _noShoppingCart = false;

	constructor(
		user: User,
		title: string,
		language: string,
		getUserMoney: (userId: string) => Promise<number>,
		removeUserMoney: (userId: string, amount: number) => Promise<void>
	) {
		this._user = user;
		this._title = title;
		this._language = language;
		this._getUserMoney = getUserMoney;
		this._removeUserMoney = removeUserMoney;
	}

	addCategory(category: ShopItemCategory): DraftBotShopMessageBuilder {
		this._shopItemCategories.push(category);
		return this;
	}

	noShoppingCart(): DraftBotShopMessageBuilder {
		this._noShoppingCart = true;
		return this;
	}

	endCallback(callback: (message: DraftBotShopMessage, reason: ShopEndReason) => void): DraftBotShopMessageBuilder {
		this._shopEndCallback = callback;
		return this;
	}

	async build(): Promise<DraftBotShopMessage> {
		return new DraftBotShopMessage(
			this._shopItemCategories,
			this._language,
			(this._noShoppingCart ? this._title : Constants.REACTIONS.SHOPPING_CART + " " + this._title) + " :",
			this._user,
			await this._getUserMoney(this._user.id),
			this._getUserMoney,
			this._removeUserMoney,
			this._shopEndCallback
		);
	}
}

export class ShopItem {
	private readonly _emote: string;

	private readonly _name: string;

	private readonly _price: number;

	private readonly _buyCallback: (message: DraftBotShopMessage) => Promise<void>

	constructor(emote: string, name: string, price: number, buyCallback: (message: DraftBotShopMessage) => Promise<void>) {
		this._emote = emote;
		this._name = name;
		this._price = price;
		this._buyCallback = buyCallback;
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