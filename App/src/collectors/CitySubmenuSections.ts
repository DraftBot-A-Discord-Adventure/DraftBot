import {
	CITY_REACTION_KINDS, CityMobileSnapshot
} from "ws-packets/src/fromServer/collectors";
import { i18n } from "@/src/translations/i18n";
import type {
	CityEntry, CityListItem, CitySubmenu, CitySubmenuSection
} from "@/src/collectors/CityCollector";

export type SubmenuDependencies = {
	homeFeatureItems: (snapshot: CityMobileSnapshot | undefined) => CityListItem[];
	gardenPlotItems: (snapshot: CityMobileSnapshot | undefined) => CityListItem[];
	enchantmentCatalogItems: () => CityListItem[];
};

const reactionItems = (entries: CityEntry[]): CityListItem[] => entries.map(entry => ({
	kind: "reaction" as const, entry
}));
const section = (titleKey: string, items: CityListItem[]): CitySubmenuSection => ({
	title: i18n.t(titleKey), items
});

function innSections(entries: CityEntry[]): CitySubmenuSection[] {
	return [
		section("app:city.titles.meals", reactionItems(entries.filter(entry => entry.reaction.type === CITY_REACTION_KINDS.INN_MEAL))),
		section("app:city.titles.rooms", reactionItems(entries.filter(entry => entry.reaction.type === CITY_REACTION_KINDS.INN_ROOM)))
	];
}

function simpleSections(view: CitySubmenu, entries: CityEntry[], snapshot: CityMobileSnapshot | undefined, deps: SubmenuDependencies): CitySubmenuSection[] | undefined {
	const reactions = reactionItems(entries);
	const factories: Partial<Record<CitySubmenu, () => CitySubmenuSection[]>> = {
		inn: () => innSections(entries),
		home: () => [section("app:city.titles.homeServices", [...reactions, ...deps.homeFeatureItems(snapshot)])],
		homeBed: () => [section("app:city.titles.actions", reactions)],
		guild: () => [section("app:city.titles.actions", reactions)],
		enchanter: () => [section("app:city.titles.eligibleEquipment", reactions), section("app:city.enchantmentCatalog.title", deps.enchantmentCatalogItems())],
		homeGarden: () => [section("app:city.titles.garden", [...deps.gardenPlotItems(snapshot), ...reactions])],
		homeUpgrade: () => [section("app:city.titles.equipment", reactions)]
	};
	return factories[view]?.();
}

const NOTARY_TITLE_KEYS: Partial<Record<string, string>> = {
	[CITY_REACTION_KINDS.APARTMENT_BUY]: "app:city.titles.apartments",
	[CITY_REACTION_KINDS.APARTMENT_CLAIM_RENT]: "app:city.titles.apartments",
	[CITY_REACTION_KINDS.GUILD_DOMAIN_NOTARY]: "app:city.labels.guildDomain"
};

const GROUPED_TITLE_KEYS: Partial<Record<CitySubmenu, (type: string) => string>> = {
	notary: type => NOTARY_TITLE_KEYS[type] ?? "app:city.titles.yourHome",
	blacksmith: type => type === CITY_REACTION_KINDS.BLACKSMITH_DISENCHANT ? "app:city.titles.disenchant" : "app:city.titles.equipment",
	scrapDealer: () => "app:city.titles.recycling"
};

function groupedTitleKey(view: CitySubmenu, type: string): string {
	return GROUPED_TITLE_KEYS[view]?.(type) ?? "app:city.titles.actions";
}

function groupedSections(view: CitySubmenu, entries: CityEntry[], pinned: Record<string, CityListItem[]> = {}): CitySubmenuSection[] {
	const groups: Record<string, CityListItem[]> = Object.fromEntries(Object.entries(pinned).map(([titleKey, items]) => [titleKey, [...items]]));
	for (const entry of entries) {
		const titleKey = groupedTitleKey(view, entry.reaction.type);
		(groups[titleKey] ??= []).push({
			kind: "reaction", entry
		});
	}
	return Object.entries(groups).map(([titleKey, items]) => section(titleKey, items));
}

type HomeManage = NonNullable<NonNullable<CityMobileSnapshot["home"]>["manage"]>;

function homeUpgradeLimitReason(manage: HomeManage | undefined): string | undefined {
	if (manage?.requiredPlayerLevelForUpgrade !== undefined) {
		return i18n.t("app:city.locks.playerLevel", { level: manage.requiredPlayerLevelForUpgrade });
	}
	return manage?.isMaxLevel ? i18n.t("app:city.locks.homeMaxLevel") : undefined;
}

/** The home the upgrade would give, or the current one once it is at its highest level. */
function homeUpgradeIcon(level: number | undefined, isMaxLevel: boolean | undefined): string {
	if (level === undefined) {
		return "city.manageHome";
	}
	return `city.home.${isMaxLevel ? level : level + 1}`;
}

/** The upgrade Core does not offer yet, or no longer: said on a greyed row rather than silently left out. */
function homeUpgradeLimit(snapshot: CityMobileSnapshot | undefined): CityListItem[] {
	const manage = snapshot?.home?.manage;
	const reason = homeUpgradeLimitReason(manage);
	if (!reason) {
		return [];
	}
	return [
		{
			kind: "info",
			key: "home-upgrade-limit",
			iconPath: homeUpgradeIcon(snapshot?.home?.owned?.level, manage?.isMaxLevel),
			title: i18n.t("app:city.reactions.upgradeHome"),
			subtitle: i18n.t("app:city.subtitles.upgradeHome"),
			lock: { reason }
		}
	];
}

/** An apartment a beginner cannot buy yet: shown with its reason, so the notary teaches it exists. */
function apartmentRequiringHome(snapshot: CityMobileSnapshot | undefined): CityListItem[] {
	if (snapshot?.apartmentNotary?.requiresHomePrice === undefined) {
		return [];
	}
	return [
		{
			kind: "info",
			key: "apartment-requires-home",
			iconPath: "city.apartmentNotary.buy",
			title: i18n.t("commands:report.city.homes.apartmentNotary.buyButtonLabel"),
			subtitle: i18n.t("app:city.subtitles.buyApartmentFoothold"),
			lock: { reason: i18n.t("app:city.locks.apartmentRequiresHome") }
		}
	];
}

export function submenuSections(view: CitySubmenu, entries: CityEntry[], snapshot: CityMobileSnapshot | undefined, deps: SubmenuDependencies): CitySubmenuSection[] {
	if (view === "notary") {
		return groupedSections(view, entries, {
			"app:city.titles.yourHome": homeUpgradeLimit(snapshot),
			"app:city.titles.apartments": apartmentRequiringHome(snapshot)
		}).filter(notarySection => notarySection.items.length > 0);
	}
	return simpleSections(view, entries, snapshot, deps) ?? groupedSections(view, entries);
}
