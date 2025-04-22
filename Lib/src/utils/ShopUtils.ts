import {
	ShopItemType, ShopItemTypeToString
} from "../constants/LogsConstants";

export function shopItemTypeToId(shopItemType: ShopItemType): string {
	return ShopItemTypeToString[shopItemType];
}

export function shopItemTypeFromId(id: string): ShopItemType {
	return parseInt(Object.keys(ShopItemTypeToString).find(key => ShopItemTypeToString[key as unknown as ShopItemType] === id)!, 10) as ShopItemType;
}
