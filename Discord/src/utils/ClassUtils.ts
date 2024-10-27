import {EmoteUtils} from "./EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {Language} from "../../../Lib/src/Language";
import i18n from "../translations/i18n";

export class ClassUtils {

	/**
	 * Return the icon of the class
	 * @param classID
	 */
	static getClassIcon(classID: number): string {
		return EmoteUtils.translateEmojiToDiscord(DraftBotIcons.classes[classID]);
	}

	/**
	 * Return the string of a class
	 * @param lng
	 * @param classID
	 */
	static classToString(lng: Language, classID: number): string {
		return i18n.t("commands:profile:playerClass.fieldValue", {
			lng,
			emote: ClassUtils.getClassIcon(classID),
			className: i18n.t(`models:classes.${classID}`, {lng})
		});
	}
}