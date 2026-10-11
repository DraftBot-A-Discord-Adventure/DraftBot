import {
	afterAll, beforeAll, describe, expect, it
} from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type { Home as HomeType } from "../../src/core/database/game/models/Home";
import type { PacketContext } from "../../../Lib/src/packets/CrowniclesPacket";
import { getCookingGrade } from "../../../Lib/src/constants/CookingConstants";
import { CookingCraftErrors } from "../../../Lib/src/types/CookingTypes";

type ReportCookingServiceModule = typeof import("../../src/core/report/ReportCookingService");
type CookingServiceModule = typeof import("../../src/core/cooking/CookingService");
type MaterialModule = typeof import("../../src/core/database/game/models/Material");
type HomePlantStorageModule = typeof import("../../src/core/database/game/models/HomePlantStorage");

const KEYCLOAK_ID = "cooking-grade-up";
const LEVEL_BEFORE_GRADE = 10;

describe("cooking craft reaching a new grade", () => {
	let env: CoreTestEnvironment;
	let Player: ModelStatic<PlayerType>;
	let Home: ModelStatic<HomeType>;
	let reportCooking: ReportCookingServiceModule;
	let cooking: CookingServiceModule["CookingService"];
	let materials: MaterialModule["Materials"];
	let plantStorages: HomePlantStorageModule["HomePlantStorages"];

	beforeAll(async () => {
		env = await setupCoreForTests("cookinggradeup");
		Player = env.crownicles.gameDatabase.sequelize.models.Player as ModelStatic<PlayerType>;
		Home = env.crownicles.gameDatabase.sequelize.models.Home as ModelStatic<HomeType>;
		reportCooking = loadProductionModule<ReportCookingServiceModule>("core/report/ReportCookingService");
		cooking = loadProductionModule<CookingServiceModule>("core/cooking/CookingService").CookingService;
		materials = loadProductionModule<MaterialModule>("core/database/game/models/Material").Materials;
		plantStorages = loadProductionModule<HomePlantStorageModule>("core/database/game/models/HomePlantStorage").HomePlantStorages;
	});

	afterAll(async () => {
		await env?.teardown();
	});

	it("answers with the level up when the craft reaches a new grade", async () => {
		const player = await Player.create({
			keycloakId: KEYCLOAK_ID,
			level: 50,
			cookingLevel: LEVEL_BEFORE_GRADE
		});
		player.cookingExperience = cooking.getXpNeededForLevel(LEVEL_BEFORE_GRADE) - 1;
		await player.save();
		const models = env.crownicles.gameDatabase.sequelize.models;
		await models.PlayerMissionsInfo.create({ playerId: player.id });
		await models.MissionSlot.create({
			playerId: player.id,
			missionId: "reachCookingLevel",
			missionVariant: 0,
			missionObjective: LEVEL_BEFORE_GRADE + 1,
			numberDone: LEVEL_BEFORE_GRADE,
			expiresAt: null,
			gemsToWin: 4,
			pointsToWin: 0,
			xpToWin: 250,
			moneyToWin: 0
		});
		const home = await Home.create({
			ownerId: player.id,
			cityId: "cooking-test-city",
			level: 8
		});
		const cookingSlots = home.getLevel()!.features.cookingSlots;
		expect(cookingSlots).toBeGreaterThan(0);
		const slots = await cooking.getSlotRecipes({
			player, homeId: home.id, cookingSlots
		});
		const slot = slots.find(candidate => candidate.recipe)!;
		for (const plant of slot.recipe!.ingredients.plants) {
			await plantStorages.addPlant(home.id, plant.plantId as never, plant.quantity, 999);
		}
		for (const material of slot.recipe!.ingredients.materials) {
			await materials.giveMaterial(player.id, material.materialId, material.quantity);
		}

		const context = {
			frontEndOrigin: "discord",
			frontEndSubOrigin: "guild",
			keycloakId: KEYCLOAK_ID,
			discord: {
				user: KEYCLOAK_ID,
				interaction: "interaction",
				channel: "channel",
				language: "fr",
				shardId: 0
			}
		} as PacketContext;
		const craftPacket = {
			slotIndex: slot.slotIndex,
			recipeId: slot.recipe!.id
		};
		const response = await reportCooking.handleCookingCraft(KEYCLOAK_ID, craftPacket, context);

		expect(response[0]).toMatchObject({
			success: true,
			cookingLevelUp: true,
			newCookingLevel: LEVEL_BEFORE_GRADE + 1,
			newCookingGrade: getCookingGrade(LEVEL_BEFORE_GRADE + 1).id,
			error: undefined
		});

		// A second click on the same button is what showed "craftUnavailable" instead of the level up (#4890)
		const staleResponse = await reportCooking.handleCookingCraft(KEYCLOAK_ID, craftPacket, context);
		expect(staleResponse[0]).toMatchObject({ error: CookingCraftErrors.CRAFT_UNAVAILABLE });
		expect((await Player.findByPk(player.id))!.cookingLevel).toBe(LEVEL_BEFORE_GRADE + 1);
	});
});
