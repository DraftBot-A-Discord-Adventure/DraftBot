import {useSyncExternalStore} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ItemFoundRes} from "ws-packets/src/fromServer/inventory/ItemFoundRes";
import {FightMonsterRewardRes} from "ws-packets/src/fromServer/fight/FightRes";
import {BossRecord} from "ws-packets/src/objects/Fight";
import {ItemRarity} from "ws-packets/src/objects/ItemRarity";
import {ItemWithDetails} from "ws-packets/src/objects/ItemWithDetails";
import {WebSocketClient} from "@/src/networking/WebSocketClient";

export const MEMORABLE_MOMENT_KINDS = {
	BADGE: "badge",
	MYTHIC_ITEM: "mythicItem",
	BOSS_RECORD: "bossRecord"
} as const;

export type MemorableMoment = {at: number} & (
	| {kind: typeof MEMORABLE_MOMENT_KINDS.BADGE; badge: string; owned: number; total: number}
	| {kind: typeof MEMORABLE_MOMENT_KINDS.MYTHIC_ITEM; item: ItemWithDetails}
	| {kind: typeof MEMORABLE_MOMENT_KINDS.BOSS_RECORD; record: BossRecord}
);

const KNOWN_BADGES_STORAGE_KEY = "memorableMoments.knownBadges.";

type KnownBadges = {badges: Set<string>; baseline: boolean};

/** The moments worth sharing, shown one after the other once the game has nothing else to tell. */
class MemorableMomentStore {
	private queue: MemorableMoment[] = [];

	private readonly knownBadges = new Map<string, Promise<KnownBadges>>();

	private readonly listeners = new Set<() => void>();

	public constructor() {
		const client = WebSocketClient.getInstance();
		client.registerPushedPacketHandler<ItemFoundRes>(ItemFoundRes.wireName, packet => {
			if (packet.item.rarity === ItemRarity.MYTHICAL) this.add({kind: MEMORABLE_MOMENT_KINDS.MYTHIC_ITEM, item: packet.item, at: Date.now()});
		});
		client.registerPushedPacketHandler<FightMonsterRewardRes>(FightMonsterRewardRes.wireName, packet => {
			if (packet.reward.bossRecord) this.add({kind: MEMORABLE_MOMENT_KINDS.BOSS_RECORD, record: packet.reward.bossRecord, at: Date.now()});
		});
	}

	public readonly subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return (): void => {
			this.listeners.delete(listener);
		};
	};

	public readonly getSnapshot = (): MemorableMoment | null => this.queue[0] ?? null;

	public readonly dismiss = (): void => {
		if (this.queue.length === 0) return;
		this.queue = this.queue.slice(1);
		this.notify();
	};

	/**
	 * Badges are awarded by many flows, some while the app is closed: the profile is compared with the
	 * badges this device already saw for the character. The first reading only learns them.
	 */
	public readonly observeBadges = async (owner: string, badges: string[], celebrated: readonly string[]): Promise<void> => {
		const known = await this.knownBadgesOf(owner);
		const earned = known.baseline ? [] : badges.filter(badge => !known.badges.has(badge));
		const learned = known.baseline || earned.length > 0;
		known.baseline = false;
		for (const badge of badges) known.badges.add(badge);
		const owned = badges.filter(badge => celebrated.includes(badge)).length;
		for (const badge of earned.filter(badge => celebrated.includes(badge))) {
			this.add({kind: MEMORABLE_MOMENT_KINDS.BADGE, badge, owned, total: celebrated.length, at: Date.now()});
		}
		if (learned) await AsyncStorage.setItem(KNOWN_BADGES_STORAGE_KEY + owner, JSON.stringify([...known.badges]));
	};

	private knownBadgesOf(owner: string): Promise<KnownBadges> {
		let known = this.knownBadges.get(owner);
		if (!known) {
			known = AsyncStorage.getItem(KNOWN_BADGES_STORAGE_KEY + owner).then(saved => (saved === null
				? {badges: new Set<string>(), baseline: true}
				: {badges: new Set<string>(JSON.parse(saved) as string[]), baseline: false}));
			this.knownBadges.set(owner, known);
		}
		return known;
	}

	private add(moment: MemorableMoment): void {
		this.queue = [...this.queue, moment];
		this.notify();
	}

	private notify(): void {
		for (const listener of this.listeners) listener();
	}
}

export const memorableMomentStore = new MemorableMomentStore();

export function useMemorableMoment(): MemorableMoment | null {
	return useSyncExternalStore(memorableMomentStore.subscribe, memorableMomentStore.getSnapshot, memorableMomentStore.getSnapshot);
}
