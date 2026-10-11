import { ReactNode } from "react";
import {
	CITY_REACTION_KINDS, CityMobileSnapshot, ReactionCollectorReaction
} from "ws-packets/src/fromServer/collectors";
import {
	HOME_UPGRADE_CHANGES, HomeUpgradeChange
} from "ws-packets/src/objects/HomeUpgrade";
import {
	apartmentBenefits, apartmentRentedHere
} from "@/src/collectors/ApartmentBenefits";
import {
	Benefit, Benefits
} from "@/src/components/Benefits";
import { i18n } from "@/src/translations/i18n";

const UPGRADE_CHANGE_ICONS: Record<HomeUpgradeChange, string> = {
	[HOME_UPGRADE_CHANGES.CHEST]: "city.homeUpgrades.chest",
	[HOME_UPGRADE_CHANGES.BIGGER_CHEST]: "city.homeUpgrades.chest",
	[HOME_UPGRADE_CHANGES.INVENTORY_BONUS]: "city.homeUpgrades.chest",
	[HOME_UPGRADE_CHANGES.UPGRADE_ITEM_STATION]: "city.homeUpgrades.upgradeEquipment",
	[HOME_UPGRADE_CHANGES.BETTER_UPGRADE_ITEM_STATION]: "city.homeUpgrades.upgradeEquipment",
	[HOME_UPGRADE_CHANGES.BETTER_BED]: "city.homeUpgrades.bed",
	[HOME_UPGRADE_CHANGES.GARDEN]: "city.homeUpgrades.garden",
	[HOME_UPGRADE_CHANGES.BIGGER_GARDEN]: "city.homeUpgrades.garden",
	[HOME_UPGRADE_CHANGES.BETTER_GARDEN_EARTH]: "city.homeUpgrades.earthQuality",
	[HOME_UPGRADE_CHANGES.COOKING_STATION]: "city.homeUpgrades.cooking",
	[HOME_UPGRADE_CHANGES.BETTER_COOKING_STATION]: "city.homeUpgrades.cooking"
};

function upgradeBenefits(changes: HomeUpgradeChange[]): Benefit[] {
	return changes.map(change => ({
		key: change,
		iconPath: UPGRADE_CHANGE_ICONS[change],
		title: i18n.t(`app:city.upgradeChanges.${change}.title`),
		description: i18n.t(`app:city.upgradeChanges.${change}.description`)
	}));
}

function apartmentBuyBenefits(snapshot: CityMobileSnapshot | undefined): Benefit[] {
	const elsewhere = snapshot?.home?.elsewhere;
	const forSale = snapshot?.apartmentNotary?.forSale;
	return apartmentBenefits(apartmentRentedHere(snapshot), {
		...forSale ? { price: forSale.price } : {},
		...elsewhere ? { home: elsewhere } : {}
	});
}

const ROW_BENEFITS: Partial<Record<string, (snapshot: CityMobileSnapshot | undefined) => Benefit[]>> = {
	[CITY_REACTION_KINDS.UPGRADE_HOME]: snapshot => upgradeBenefits(snapshot?.home?.manage?.upgradeChanges ?? []),
	[CITY_REACTION_KINDS.APARTMENT_BUY]: apartmentBuyBenefits
};

function rowBenefits(reaction: ReactionCollectorReaction, snapshot: CityMobileSnapshot | undefined): Benefit[] {
	return ROW_BENEFITS[reaction.type]?.(snapshot) ?? [];
}

/** What the player weighs before confirming: everything a home upgrade or an apartment brings. */
export function cityRowDetails(reaction: ReactionCollectorReaction, snapshot: CityMobileSnapshot | undefined): ReactNode {
	const benefits = rowBenefits(reaction, snapshot);
	return benefits.length > 0 ? <Benefits items={benefits} /> : null;
}
