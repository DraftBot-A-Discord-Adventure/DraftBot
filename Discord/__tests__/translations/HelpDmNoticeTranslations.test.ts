import {
	describe, expect, it
} from "vitest";
import i18n from "../../src/translations/i18n";
import { LANGUAGE } from "../../../Lib/src/Language";
import { HelpConstants } from "../../../Lib/src/constants/HelpConstants";

describe("/help DM notice translations", () => {
	it.each(LANGUAGE.LANGUAGES)("renders the server notice with the invite link in %s", lng => {
		expect(i18n.t("commands:help.dmNoticeTitle", { lng })).not.toBe("help.dmNoticeTitle");
		expect(i18n.t("commands:help.dmNoticeValue", {
			lng,
			inviteLink: HelpConstants.HELP_INVITE_LINK
		})).toContain(HelpConstants.HELP_INVITE_LINK);
	});
});
