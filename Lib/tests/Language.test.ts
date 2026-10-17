import {
	describe, expect, it
} from "vitest";
import { LANGUAGE } from "../src/Language";

describe("LANGUAGE.fromLocale", () => {
	it("keeps a supported language", () => {
		expect(LANGUAGE.fromLocale("fr")).toBe(LANGUAGE.FRENCH);
	});

	it("drops the region of a regional locale", () => {
		expect(LANGUAGE.fromLocale("pt-BR")).toBe(LANGUAGE.PORTUGUESE);
		expect(LANGUAGE.fromLocale("en-US")).toBe(LANGUAGE.ENGLISH);
	});

	it("falls back to the default language for an unsupported locale", () => {
		expect(LANGUAGE.fromLocale("ja")).toBe(LANGUAGE.DEFAULT_LANGUAGE);
	});
});
