import {
	describe, expect, it, vi
} from "vitest";
import {
	ContainerBuilder, Message
} from "discord.js";
import { LANGUAGE } from "../../../../Lib/src/Language";
import {
	CommandTournamentAdminMenuPacketRes, CommandTournamentOwnerMenuPacketRes
} from "../../../../Lib/src/packets/commands/CommandTournamentPacket";
import {
	TournamentLevelLimitModes, TournamentStatuses, type TournamentLevelLimitMode, type TournamentStatus
} from "../../../../Lib/src/types/Tournament";
import { DiscordConstants } from "../../../src/DiscordConstants";

const state = vi.hoisted(() => ({
	mainMenu: undefined as unknown,
	menus: undefined as Map<string, unknown> | undefined
}));

vi.mock("../../../src/bot/DiscordCache", () => ({
	DiscordCache: {
		getInteraction: vi.fn(() => ({
			user: { id: "discord-user-id" },
			userLanguage: LANGUAGE.FRENCH
		}))
	}
}));

vi.mock("../../../src/messages/CrowniclesNestedMenus", () => ({
	CrowniclesNestedMenus: class {
		public constructor(mainMenu: unknown, menus: Map<string, unknown>) {
			state.mainMenu = mainMenu;
			state.menus = menus;
		}

		public async send(): Promise<Message> {
			return {
				createReactionCollector: vi.fn(() => ({
					on: vi.fn()
				}))
			} as unknown as Message;
		}
	}
}));

import {
	handleTournamentAdminMenu, handleTournamentOwnerMenu, TOURNAMENT_MENU_IDS
} from "../../../src/commands/tournament/TournamentMenus";

function getContainer(menu: unknown): ContainerBuilder {
	return (menu as { containers: ContainerBuilder[] }).containers[0];
}

function getSectionButtonIds(container: ContainerBuilder): string[] {
	return container.components.flatMap(component => {
		if (!("accessory" in component) || !component.accessory || !("data" in component.accessory)) {
			return [];
		}
		const customId = component.accessory.data.custom_id;
		return typeof customId === "string" ? [customId] : [];
	});
}

type SerializedComponent = {
	custom_id?: string;
	disabled?: boolean;
	options?: {
		value: string;
		default?: boolean;
	}[];
	components?: SerializedComponent[];
	accessory?: SerializedComponent;
};

type CollectHandler = (componentInteraction: object) => Promise<void>;

type CreationScenario = {
	mode: TournamentLevelLimitMode;
	withDurations: boolean;
	levelCap?: number;
};

const CUSTOM_LEVEL_MODES: TournamentLevelLimitMode[] = [TournamentLevelLimitModes.CAP, TournamentLevelLimitModes.REJECT];

const SELECTED_LEVEL_CAP = 50;

function getSerializedContainer(menu: unknown): SerializedComponent {
	return getContainer(menu).toJSON() as SerializedComponent;
}

function getChildComponents(component: SerializedComponent): SerializedComponent[] {
	return [...component.components ?? [], ...component.accessory ? [component.accessory] : []];
}

function countComponents(component: SerializedComponent): number {
	return getChildComponents(component).reduce((total, child) => total + countComponents(child), 1);
}

function findComponent(component: SerializedComponent, customId: string): SerializedComponent | undefined {
	if (component.custom_id === customId) {
		return component;
	}
	return getChildComponents(component)
		.map(child => findComponent(child, customId))
		.find(found => found !== undefined);
}

async function interactWithMenu(menu: unknown, componentInteraction: object): Promise<unknown> {
	let collectHandler: CollectHandler | undefined;
	let currentMenu = menu;
	const nestedMenus = {
		registerMenu: vi.fn((_menuId: string, registeredMenu: unknown) => {
			currentMenu = registeredMenu;
		}),
		changeMenu: vi.fn()
	};
	const message = {
		createMessageComponentCollector: vi.fn(() => ({
			on: vi.fn((event: string, handler: CollectHandler) => {
				if (event === "collect") {
					collectHandler = handler;
				}
			})
		}))
	};
	(menu as { createCollector: (nestedMenus: object, message: object) => unknown }).createCollector(nestedMenus, message);
	if (!collectHandler) {
		throw new Error("The menu did not register a collect handler");
	}
	await collectHandler({
		user: { id: "discord-user-id" },
		deferUpdate: vi.fn(),
		...componentInteraction
	});
	return currentMenu;
}

function clickButton(menu: unknown, customId: string): Promise<unknown> {
	return interactWithMenu(menu, {
		customId,
		isButton: () => true,
		isStringSelectMenu: () => false
	});
}

function selectOption(menu: unknown, customId: string, value: string): Promise<unknown> {
	return interactWithMenu(menu, {
		customId,
		values: [value],
		isButton: () => false,
		isStringSelectMenu: () => true
	});
}

async function openCreateMenu(): Promise<unknown> {
	await handleTournamentAdminMenu({
		discord: { interaction: "interaction-id" }
	} as never, {
		tournaments: [],
		hasAvailableCode: true
	});
	return state.menus?.get(TOURNAMENT_MENU_IDS.ADMIN_CREATE);
}

async function buildCreateMenu(scenario: CreationScenario): Promise<unknown> {
	let menu = await clickButton(await openCreateMenu(), `${TOURNAMENT_MENU_IDS.CREATE_LEVEL_MODE_PREFIX}${scenario.mode}`);
	if (scenario.withDurations) {
		menu = await clickButton(menu, `${TOURNAMENT_MENU_IDS.CREATE_REGISTRATION_PREFIX}1`);
		menu = await clickButton(menu, `${TOURNAMENT_MENU_IDS.CREATE_COMBAT_PREFIX}3`);
	}
	if (scenario.levelCap !== undefined) {
		menu = await selectOption(menu, TOURNAMENT_MENU_IDS.CREATE_LEVEL_CAP_SELECT, scenario.levelCap.toString());
	}
	return menu;
}

function buildCreationScenarios(): CreationScenario[] {
	return Object.values(TournamentLevelLimitModes).flatMap(mode => [
		{
			mode,
			withDurations: false
		},
		{
			mode,
			withDurations: true
		},
		...CUSTOM_LEVEL_MODES.includes(mode)
			? [
				{
					mode,
					withDurations: false,
					levelCap: SELECTED_LEVEL_CAP
				},
				{
					mode,
					withDurations: true,
					levelCap: SELECTED_LEVEL_CAP
				}
			]
			: []
	]);
}

function buildTournamentSummary(id: number, status: TournamentStatus): CommandTournamentAdminMenuPacketRes["tournaments"][number] {
	return {
		id,
		status,
		discordChannelId: "tournament-channel",
		registrationEndsAt: Date.now() + 86_400_000,
		combatEndsAt: Date.now() + 172_800_000,
		participantCount: 20
	};
}

describe("Tournament menus", () => {
	it("renders the admin root as a city-style V2 menu", async () => {
		await handleTournamentAdminMenu({
			discord: { interaction: "interaction-id" }
		} as never, {
			tournaments: [buildTournamentSummary(42, TournamentStatuses.REGISTRATION)],
			hasAvailableCode: true
		});

		const container = getContainer(state.mainMenu);
		const buttonIds = getSectionButtonIds(container);
		expect(buttonIds).toContain(TOURNAMENT_MENU_IDS.ADMIN_CREATE);
		expect(buttonIds).toContain(TOURNAMENT_MENU_IDS.ADMIN_CANCEL);
		expect(state.menus?.has(TOURNAMENT_MENU_IDS.ADMIN_CREATE)).toBe(true);
		expect(state.menus?.has(TOURNAMENT_MENU_IDS.ADMIN_CANCEL)).toBe(true);
		expect(container.components.some(component => "accessory" in component)).toBe(true);
	});

	it("lets sub menus come back to the admin root and resume paused tournaments", async () => {
		await handleTournamentAdminMenu({
			discord: { interaction: "interaction-id" }
		} as never, {
			tournaments: [buildTournamentSummary(42, TournamentStatuses.PAUSED)],
			hasAvailableCode: false
		});

		const buttonIds = getSectionButtonIds(getContainer(state.mainMenu));
		expect(state.menus?.get(TOURNAMENT_MENU_IDS.ADMIN_ROOT)).toBe(state.mainMenu);
		expect(buttonIds).toContain(TOURNAMENT_MENU_IDS.RESUME);
		expect(state.menus?.has(TOURNAMENT_MENU_IDS.RESUME)).toBe(true);
	});

	it("renders owner paused tournaments without command parameters", async () => {
		await handleTournamentOwnerMenu({
			discord: { interaction: "interaction-id" }
		} as never, {
			pausedTournaments: [buildTournamentSummary(7, TournamentStatuses.PAUSED)]
		} as CommandTournamentOwnerMenuPacketRes);

		const container = getContainer(state.mainMenu);
		const buttonIds = getSectionButtonIds(container);
		expect(buttonIds).toContain(TOURNAMENT_MENU_IDS.RESUME);
		expect(state.menus?.has(TOURNAMENT_MENU_IDS.RESUME)).toBe(true);
	});

	it("offers selectable tournament categories and durations in the create wizard", async () => {
		await handleTournamentAdminMenu({
			discord: { interaction: "interaction-id" }
		} as never, {
			tournaments: [],
			hasAvailableCode: true
		});

		const createMenu = state.menus?.get(TOURNAMENT_MENU_IDS.ADMIN_CREATE);
		const container = getContainer(createMenu);
		const json = container.toJSON();
		const serialized = JSON.stringify(json);
		expect(serialized).toContain(TOURNAMENT_MENU_IDS.CREATE_REGISTRATION_PREFIX);
		expect(serialized).toContain(TOURNAMENT_MENU_IDS.CREATE_COMBAT_PREFIX);
		expect(serialized).toContain(TOURNAMENT_MENU_IDS.CREATE_LEVEL_MODE_PREFIX);
		expect(serialized).toContain(TOURNAMENT_MENU_IDS.CREATE_CONFIRM);
		expect(serialized).not.toContain("code");
	});

	it.each(buildCreationScenarios())("keeps the create wizard within the Components V2 limit (%o)", async scenario => {
		const container = getSerializedContainer(await buildCreateMenu(scenario));

		expect(countComponents(container)).toBeLessThanOrEqual(DiscordConstants.MAX_COMPONENTS_V2_PER_MESSAGE);
	});

	it.each(CUSTOM_LEVEL_MODES)("picks the level cap from a select menu in %s mode", async mode => {
		const incompleteContainer = getSerializedContainer(await buildCreateMenu({
			mode,
			withDurations: true
		}));
		expect(findComponent(incompleteContainer, TOURNAMENT_MENU_IDS.CREATE_LEVEL_CAP_SELECT)?.options?.some(option => option.default)).toBe(false);
		expect(findComponent(incompleteContainer, TOURNAMENT_MENU_IDS.CREATE_CONFIRM)?.disabled).toBe(true);

		const completeContainer = getSerializedContainer(await buildCreateMenu({
			mode,
			withDurations: true,
			levelCap: SELECTED_LEVEL_CAP
		}));
		const selectedOptions = findComponent(completeContainer, TOURNAMENT_MENU_IDS.CREATE_LEVEL_CAP_SELECT)?.options?.filter(option => option.default);
		expect(selectedOptions?.map(option => option.value)).toEqual([SELECTED_LEVEL_CAP.toString()]);
		expect(findComponent(completeContainer, TOURNAMENT_MENU_IDS.CREATE_CONFIRM)?.disabled).toBe(false);
	});

	it("acknowledges the level cap selection and ignores unknown values", async () => {
		const menu = await buildCreateMenu({
			mode: TournamentLevelLimitModes.CAP,
			withDurations: true
		});
		const selectionInteraction = {
			customId: TOURNAMENT_MENU_IDS.CREATE_LEVEL_CAP_SELECT,
			isButton: () => false,
			isStringSelectMenu: () => true
		};

		const deferUpdate = vi.fn();
		const unchangedMenu = await interactWithMenu(menu, {
			...selectionInteraction,
			values: ["42"],
			deferUpdate
		});
		expect(unchangedMenu).toBe(menu);
		expect(deferUpdate).not.toHaveBeenCalled();

		await interactWithMenu(menu, {
			...selectionInteraction,
			values: [SELECTED_LEVEL_CAP.toString()],
			deferUpdate
		});
		expect(deferUpdate).toHaveBeenCalledOnce();
	});

	it("hides the level cap select menu outside custom level modes", async () => {
		const container = getSerializedContainer(await buildCreateMenu({
			mode: TournamentLevelLimitModes.CATEGORY,
			withDurations: true
		}));

		expect(findComponent(container, TOURNAMENT_MENU_IDS.CREATE_LEVEL_CAP_SELECT)).toBeUndefined();
		expect(findComponent(container, TOURNAMENT_MENU_IDS.CREATE_CONFIRM)?.disabled).toBe(false);
	});
});
