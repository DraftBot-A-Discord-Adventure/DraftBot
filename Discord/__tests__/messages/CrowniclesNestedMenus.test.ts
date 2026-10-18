import {
	describe, expect, it, vi
} from "vitest";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";

vi.mock("../../src/messages/CrowniclesNestedMenuEditUtils", () => ({
	editNestedMenuMessage: vi.fn()
}));

import { CrowniclesNestedMenus } from "../../src/messages/CrowniclesNestedMenus";
import { editNestedMenuMessage } from "../../src/messages/CrowniclesNestedMenuEditUtils";

const SELECT_CUSTOM_ID = "NESTED_MENU_TEST_SELECT";

const BUTTON_CUSTOM_ID = "NESTED_MENU_TEST_BUTTON";

function buildContainer(): ContainerBuilder {
	return new ContainerBuilder().addActionRowComponents(
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
			.setCustomId(SELECT_CUSTOM_ID)
			.addOptions(new StringSelectMenuOptionBuilder()
				.setLabel("Option")
				.setValue("option"))),
		new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
			.setCustomId(BUTTON_CUSTOM_ID)
			.setLabel("Button")
			.setStyle(ButtonStyle.Secondary))
	);
}

describe("CrowniclesNestedMenus", () => {
	it("disables buttons and select menus of V2 containers when the collector stops", async () => {
		const container = buildContainer();
		const nestedMenus = new CrowniclesNestedMenus({ containers: [container] }, new Map());
		await nestedMenus.send({
			editReply: vi.fn().mockResolvedValue({})
		} as never);

		await nestedMenus.stopCurrentCollector();

		expect(editNestedMenuMessage).toHaveBeenCalledOnce();
		const disabledStates = container.toJSON().components.flatMap(row => ("components" in row ? row.components : []))
			.map(component => ({
				customId: "custom_id" in component ? component.custom_id : undefined,
				disabled: "disabled" in component ? component.disabled : undefined
			}));
		expect(disabledStates).toEqual([
			{
				customId: SELECT_CUSTOM_ID,
				disabled: true
			},
			{
				customId: BUTTON_CUSTOM_ID,
				disabled: true
			}
		]);
	});
});
