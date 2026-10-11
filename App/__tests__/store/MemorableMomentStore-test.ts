import AsyncStorage from "@react-native-async-storage/async-storage";
import {ItemFoundRes} from "ws-packets/src/fromServer/inventory/ItemFoundRes";
import {FightMonsterRewardRes} from "ws-packets/src/fromServer/fight/FightRes";
import {ItemRarity} from "ws-packets/src/objects/ItemRarity";
import {ItemWithDetails} from "ws-packets/src/objects/ItemWithDetails";
import {WebSocketClient} from "@/src/networking/WebSocketClient";
import {MEMORABLE_MOMENT_KINDS, memorableMomentStore} from "@/src/store/MemorableMomentStore";

const CELEBRATED = ["rich", "top_week", "legendary_pet"] as const;

function dispatch(wireName: string, packet: object): void {
	Reflect.get(WebSocketClient.getInstance(), "pushedPacketRegistry").dispatch(wireName, packet);
}

function item(rarity: ItemRarity): ItemWithDetails {
	const stat = (baseValue: number): {baseValue: number; upgradeValue: number; maxValue: number} => ({baseValue, upgradeValue: 0, maxValue: baseValue});
	return {id: 12, rarity, itemCategory: 0, itemLevel: 0, attack: stat(90), defense: stat(0), speed: stat(0)};
}

function drain(): string[] {
	const kinds: string[] = [];
	for (let moment = memorableMomentStore.getSnapshot(); moment; moment = memorableMomentStore.getSnapshot()) {
		kinds.push(moment.kind);
		memorableMomentStore.dismiss();
	}
	return kinds;
}

describe("MemorableMomentStore", () => {
	beforeEach(async (): Promise<void> => {
		drain();
		await AsyncStorage.clear();
	});

	it("learns the badges of the first profile it reads without celebrating them", async () => {
		await memorableMomentStore.observeBadges("newcomer", ["rich", "top_week"], CELEBRATED);

		expect(memorableMomentStore.getSnapshot()).toBeNull();
		expect(JSON.parse(await AsyncStorage.getItem("memorableMoments.knownBadges.newcomer") ?? "[]")).toEqual(["rich", "top_week"]);
	});

	it("celebrates a badge gained while the app was closed, with how many the player now owns", async () => {
		await AsyncStorage.setItem("memorableMoments.knownBadges.veteran", JSON.stringify(["rich"]));

		await memorableMomentStore.observeBadges("veteran", ["rich", "legendary_pet"], CELEBRATED);

		expect(memorableMomentStore.getSnapshot()).toEqual(expect.objectContaining({
			kind: MEMORABLE_MOMENT_KINDS.BADGE, badge: "legendary_pet", owned: 2, total: CELEBRATED.length
		}));
	});

	it("celebrates a badge once, even when the profile is read twice before the storage answers", async () => {
		await memorableMomentStore.observeBadges("collector", ["rich"], CELEBRATED);

		await Promise.all([
			memorableMomentStore.observeBadges("collector", ["rich", "top_week"], CELEBRATED),
			memorableMomentStore.observeBadges("collector", ["rich", "top_week"], CELEBRATED)
		]);

		expect(drain()).toEqual([MEMORABLE_MOMENT_KINDS.BADGE]);
	});

	it("keeps quiet about badges that are not shown to players", async () => {
		await AsyncStorage.setItem("memorableMoments.knownBadges.supporter", JSON.stringify([]));

		await memorableMomentStore.observeBadges("supporter", ["donor"], CELEBRATED);

		expect(memorableMomentStore.getSnapshot()).toBeNull();
	});

	it("celebrates a found item only when it is mythical", () => {
		dispatch(ItemFoundRes.wireName, {item: item(ItemRarity.LEGENDARY), kept: true});
		expect(memorableMomentStore.getSnapshot()).toBeNull();

		dispatch(ItemFoundRes.wireName, {item: item(ItemRarity.MYTHICAL), kept: false});
		expect(memorableMomentStore.getSnapshot()).toEqual(expect.objectContaining({kind: MEMORABLE_MOMENT_KINDS.MYTHIC_ITEM}));
	});

	it("celebrates a boss win only when Core says it set a record, after the moments already waiting", () => {
		const reward = {money: 100, experience: 50, guildXp: 0, guildPoints: 0};
		dispatch(ItemFoundRes.wireName, {item: item(ItemRarity.MYTHICAL), kept: true});
		dispatch(FightMonsterRewardRes.wireName, {reward});
		dispatch(FightMonsterRewardRes.wireName, {reward: {...reward, bossRecord: {monsterId: "kraken", monsterLevel: 80, classId: 7}}});

		expect(drain()).toEqual([MEMORABLE_MOMENT_KINDS.MYTHIC_ITEM, MEMORABLE_MOMENT_KINDS.BOSS_RECORD]);
	});
});
