import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {TranslationModule, Translations} from "../Translations";
import {Constants} from "../Constants";
import {User} from "discord.js";
import {DraftBotErrorEmbed} from "./DraftBotErrorEmbed";
import {DraftBotValidateReactionMessage} from "./DraftBotValidateReactionMessage";

declare function format(s: string, replacement: any): string;

declare const Entities: any;

/**
 * Reasons when the shop ends
 */
export enum ShopEndReason {
	/**
	 * The player didn't react and the collector ends
	 */
	TIME,
	/**
	 * The player reacted with cancel
	 */
	REACTION,
	/**
	 * The player tried to buy something but he doesn't have enough money
	 */
	NOT_ENOUGH_MONEY,
	/**
	 * The player tried to buy something but at the last moment chose to cancel
	 */
	REFUSED_CONFIRMATION,
	/**
	 * The player bought an item successfully
	 */
	SUCCESS
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

	/**
	 * Default constructor
	 * @param shopItemCategories
	 * @param language
	 * @param title
	 * @param user
	 * @param currentMoney
	 * @param getUserMoney
	 * @param removeUserMoney
	 * @param shopEndCallback
	 */
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
			content += "**" + shopItemCategory.categoryTitle + (language === "en" ? "" : " ") + ":**\n";
			for (const shopItem of shopItemCategory.items) {
				content += format(translationModule.get("display"), {
					emote: shopItem.emote,
					name: shopItem.name,
					price: shopItem.price
				}) + "\n";
				const emoji = shopItem.emote.includes("<") ? shopItem.emote.split(":")[2].replace(">", "") : shopItem.emote;
				reactions.push(new DraftBotReaction(emoji));
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

	private async getUserMoney(): Promise<number> {
		return await this._getUserMoney(this._user.id);
	}

	private getChoseShopItem(): ShopItem {
		const emoji = this.getFirstReaction() ? this.getFirstReaction().emoji.id === null ? this.getFirstReaction().emoji.name : "<:" + this.getFirstReaction().emoji.name + ":" + this.getFirstReaction().emoji.id + ">" : null;
		const index: number = this._shopItemReactions.indexOf(emoji);
		if (index === -1) {
			return null;
		}
		return this._shopItems[index];
	}

	private async removeUserMoney(amount: number): Promise<void> {
		return await this._removeUserMoney(this._user.id, amount);
	}

	get user(): User {
		return this._user;
	}

	get language(): string {
		return this._language;
	}

	private static async shopCallback(msg: DraftBotReactionMessage): Promise<void> {
		const shopMessage = msg as DraftBotShopMessage;
		const choseShopItem = shopMessage.getChoseShopItem();
		if (choseShopItem) {
			const userMoney = await shopMessage.getUserMoney();
			if (userMoney < choseShopItem.price) {
				await shopMessage.sentMessage.channel.send({ embeds: [
					new DraftBotErrorEmbed(
						shopMessage._user,
						shopMessage._language,
						format(
							shopMessage._translationModule.get("error.cannotBuy"),
							{
								missingMoney: choseShopItem.price - userMoney
							}
						)
					)] }
				);
				shopMessage._shopEndCallback(shopMessage, ShopEndReason.NOT_ENOUGH_MONEY);
			}
			else if (choseShopItem.amounts.length === 1 && choseShopItem.amounts[0] === 1) {
				const confirmBuyMessage = await new DraftBotValidateReactionMessage(
					shopMessage._user,
					async (reactionMessage) => {
						const validateMessage = reactionMessage as DraftBotValidateReactionMessage;
						if (validateMessage.isValidated()) {
							shopMessage._shopEndCallback(shopMessage, ShopEndReason.SUCCESS);
							const removeMoney = await choseShopItem.buyCallback(shopMessage, 1);
							if (removeMoney) {
								await shopMessage.removeUserMoney(choseShopItem.price);
							}
						}
						else {
							await shopMessage.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
								shopMessage.user,
								shopMessage.language,
								shopMessage._translationModule.get("error.canceledPurchase"),
								true
							)] });
							shopMessage._shopEndCallback(shopMessage, ShopEndReason.REFUSED_CONFIRMATION);
						}
					}
				);
				confirmBuyMessage.formatAuthor(shopMessage._translationModule.get("confirm"), shopMessage._user);
				confirmBuyMessage.setDescription(format(shopMessage._translationModule.get("display"), {
					emote: choseShopItem.emote,
					name: choseShopItem.name,
					price: choseShopItem.price
				}) + "\n\n" + Constants.REACTIONS.WARNING + " " + choseShopItem.description);
				confirmBuyMessage.send(shopMessage.sentMessage.channel);
			}
			else {
				const numberReactions: DraftBotReaction[] = [];
				const prices: number[] = [];
				for (let i = 0; i < choseShopItem.amounts.length; ++i) {
					const amount = choseShopItem.amounts[i];
					const numberEmote: string = Constants.REACTIONS.NUMBERS[amount];
					if (amount < 0 || amount > 10 || choseShopItem.amounts.indexOf(amount) < i || userMoney < amount * choseShopItem.price) {
						continue;
					}
					numberReactions.push(new DraftBotReaction(numberEmote, async (reactionMessage: DraftBotReactionMessage) => {
						shopMessage._shopEndCallback(shopMessage, ShopEndReason.SUCCESS);
						const removeMoney = await choseShopItem.buyCallback(shopMessage, amount);
						if (removeMoney) {
							await shopMessage.removeUserMoney(choseShopItem.price * amount);
						}
						reactionMessage.stop();
					}));
					prices.push(amount * choseShopItem.price);
				}
				numberReactions.push(new DraftBotReaction(
					Constants.REACTIONS.REFUSE_REACTION,
					async (reactionMessage: DraftBotReactionMessage) => {
						reactionMessage.stop();
						await shopMessage.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
							shopMessage.user,
							shopMessage.language,
							shopMessage._translationModule.get("error.canceledPurchase"),
							true
						)] });
						shopMessage._shopEndCallback(shopMessage, ShopEndReason.REFUSED_CONFIRMATION);
					}
				));
				const confirmBuyMessage = await new DraftBotReactionMessage(
					numberReactions,
					[shopMessage.user.id],
					null,
					0,
					false,
					0
				);
				confirmBuyMessage.formatAuthor(shopMessage._translationModule.get("confirm"), shopMessage._user);
				let desc = format(shopMessage._translationModule.get("multipleChoice.display"), {
					emote: choseShopItem.emote,
					name: choseShopItem.name
				});
				for (const price of prices) {
					desc += format(shopMessage._translationModule.get("multipleChoice.priceDisplay"), {
						price: price
					});
				}
				desc += "\n\n" + choseShopItem.description + "\n\n" + Constants.REACTIONS.WARNING + " " + shopMessage._translationModule.get("multipleChoice.warning");
				confirmBuyMessage.setDescription(desc);
				confirmBuyMessage.send(shopMessage.sentMessage.channel);
			}
		}
		else {
			await shopMessage.sentMessage.channel.send({ embeds: [new DraftBotErrorEmbed(
				shopMessage.user,
				shopMessage.language,
				shopMessage._translationModule.get("error.leaveShop"),
				true
			)] });
			if (msg.getFirstReaction()) {
				shopMessage._shopEndCallback(shopMessage, ShopEndReason.REACTION);
			}
			else {
				shopMessage._shopEndCallback(shopMessage, ShopEndReason.TIME);
			}
		}
	}
}

/**
 * Builder for a shop
 */
export class DraftBotShopMessageBuilder {
	private _shopItemCategories: ShopItemCategory[] = [];

	private readonly _user: User;

	private readonly _title: string;

	private readonly _language: string;

	private _getUserMoney: (userId: string) => Promise<number> = async (userId) => (await Entities.getOrRegister(userId))[0].Player.money;

	private _removeUserMoney: (userId: string, amount: number) => Promise<void> = async (userId, amount) => {
		const player = (await Entities.getOrRegister(userId))[0].Player;
		player.money -= amount;
		await player.save();
	};

	private _shopEndCallback: (message: DraftBotShopMessage, reason: ShopEndReason) => void = () => { /* do nothing */
	};

	private _noShoppingCart = false;

	/**
	 * Default constructor
	 * @param user The user of the shop
	 * @param title The title of the shop
	 * @param language The language of the shop
	 */
	constructor(
		user: User,
		title: string,
		language: string
	) {
		this._user = user;
		this._title = title;
		this._language = language;
	}

	/**
	 * Add a shop category
	 * @param category
	 */
	addCategory(category: ShopItemCategory): DraftBotShopMessageBuilder {
		if (!category || category.items.length === 0 || category.items.filter(item => item !== null && item !== undefined).length === 0) {
			return this;
		}
		this._shopItemCategories.push(category);
		return this;
	}

	/**
	 * Remove the shopping cart icon before the title of the shop
	 */
	noShoppingCart(): DraftBotShopMessageBuilder {
		this._noShoppingCart = true;
		return this;
	}

	/**
	 * The callback called when the shp ends
	 * @param callback
	 */
	endCallback(callback: (message: DraftBotShopMessage, reason: ShopEndReason) => void): DraftBotShopMessageBuilder {
		this._shopEndCallback = callback;
		return this;
	}

	/**
	 * Set the function which get the money from the player
	 * To be used in the case the money is not the base game money (ex: points)
	 * It MUST query the player from the database or whatever each time this function is called in order to prevent problems of concurrent modifications
	 * @param getUserMoney
	 */
	setGetUserMoney(getUserMoney: (userId: string) => Promise<number>): DraftBotShopMessageBuilder {
		this._getUserMoney = getUserMoney;
		return this;
	}

	/**
	 * Set the function which removes money from the player
	 * To be used in the case the money is not the base game money (ex: points)
	 * It MUST query the player from the database or whatever each time this function is called in order to prevent problems of concurrent modifications
	 * @param removeUserMoney
	 */
	setRemoveUserMoney(removeUserMoney: (userId: string, amount: number) => Promise<void>): DraftBotShopMessageBuilder {
		this._removeUserMoney = removeUserMoney;
		return this;
	}

	/**
	 * Build the shop message
	 */
	async build(): Promise<DraftBotShopMessage> {
		return new DraftBotShopMessage(
			this._shopItemCategories,
			this._language,
			(this._noShoppingCart ? this._title : Constants.REACTIONS.SHOPPING_CART + " " + this._title) + (this._language === "en" ? "" : " ") + ":",
			this._user,
			await this._getUserMoney(this._user.id),
			this._getUserMoney,
			this._removeUserMoney,
			this._shopEndCallback
		);
	}
}

/**
 * An item in the shop
 */
export class ShopItem {
	private readonly _emote: string;

	private readonly _name: string;

	private readonly _price: number;

	private readonly _buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>;

	private readonly _description: string;

	private readonly _amounts: number[];

	/**
	 * Default constructor
	 * @param emote The emote of the shop item
	 * @param name The name of the shop item
	 * @param price The price of the shop item (for x1)
	 * @param description The description of the shop item
	 * @param buyCallback The callback called when this item is try to be bought
	 * It must return false if the purchase failed in order not to remove money from the player, and true if bought with success
	 * @param amounts The possible amounts for this item
	 */
	constructor(emote: string, name: string, price: number, description: string, buyCallback: (message: DraftBotShopMessage, amount: number) => Promise<boolean>, amounts = [1]) {
		this._emote = emote;
		this._name = name;
		this._price = price;
		this._buyCallback = buyCallback;
		this._description = description;
		this._amounts = amounts;
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

	get buyCallback(): (message: DraftBotShopMessage, amount: number) => Promise<boolean> {
		return this._buyCallback;
	}

	get description(): string {
		return this._description;
	}

	get amounts(): number[] {
		return this._amounts;
	}
}

/**
 * A category of the shop
 */
export class ShopItemCategory {
	private readonly _items: ShopItem[];

	private readonly _categoryTitle: string;

	/**
	 * Default constructor
	 * @param items The items in the category
	 * @param categoryTitle The title of the category
	 */
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