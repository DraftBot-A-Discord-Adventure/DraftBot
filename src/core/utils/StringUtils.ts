import {Constants} from "../Constants";

/**
 * remove discord formatting scrap from usernames
 * @param username
 */
export function escapeUsername(username: string): string {
	let fixedName = username.replace(/[*`_|]/gu, "");
	if (fixedName === "") {
		fixedName = ".";
	}
	return fixedName;
}

/**
 * Creates a bar of progression
 * @param value
 * @param maxValue
 */
export function progressBar(value: number, maxValue: number): string {
	let percentage = value / maxValue; // Calculate the percentage of the bar
	if (percentage < 0 || isNaN(percentage) || percentage === Infinity) {
		percentage = 0;
	}
	if (percentage > 1) {
		percentage = 1;
	}
	// Calculate the number of square characters to fill the progress side.
	const progress = Math.round(Constants.MESSAGES.PROGRESS_BAR_SIZE * percentage);
	// Calculate the number of dash characters to fill the empty progress side.
	const emptyProgress = Constants.MESSAGES.PROGRESS_BAR_SIZE - progress;

	// Repeat is creating a string with progress * characters in it
	const progressText = "▇".repeat(progress);

	// Repeat is creating a string with empty progress * characters in it
	const emptyProgressText = "—".repeat(emptyProgress);
	// Displaying the percentage of the bar
	const percentageText = Math.floor(percentage * 100) + "%";
	// Creating the bar
	return `\`\`\`[${progressText}${emptyProgressText}]${percentageText}\`\`\``;
}

/**
 * Check if a name is valid (his is used to check guilds names and descriptions)
 * @param name - the name to check
 * @param minLength
 * @param maxLength
 */
export function checkNameString(name: string, minLength: number, maxLength: number): boolean {
	// Here are the characters that are allowed in a name or description
	const regexAllowed = /^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû!,'.:()-]+$/u;

	// Here are the scenarios where the name is not valid and checked by this regex :
	// the name contains only numbers ^[0-9 ]+$ (only numbers and spaces)
	// $|( {2}) is used to check if there are 2 spaces in a row
	// $|([ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]{2}) is used to check if there are 2 special characters in a row
	// $|([!,'.:()]{2}) is used to check if there are 2 punctuation characters in a row
	const regexSpecialCases = /^[0-9 ]+$|( {2})+$|([ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]{2})+$|([!,'.:()-]{2})+/u;

	// We also check for the length of the name
	return regexAllowed.test(name) && !regexSpecialCases.test(name) && name.length >= minLength && name.length <= maxLength;
}

/**
 * Convert a discord id to its corresponding mention
 * @param id
 */
export function discordIdToMention(id: string): string {
	return `<@${id}>`;
}

/**
 * Check if the given variable is a Discord Mention
 * @param {String} variable
 * @return {boolean}
 */
export function isAMention(variable: string): boolean {
	if (typeof variable === "string") {
		return /^<@!?[0-9]{18}>$/u.test(variable);
	}
	return false;
}

/**
 * Check if the given variable is a Discord Emoji
 * @param {String} variable
 * @return {boolean}
 */
export function isAnEmoji(variable: string): boolean {
	return /\p{Emoji}/u.test(variable);
}

/**
 * Get the id from a mention
 * @param {any} variable
 * @return {String} The id of the mention
 */
export function getIdFromMention(variable: string): string {
	if (typeof variable === "string") {
		return "".concat(...variable.split("").filter((c) => c.match(/[0-9]/)));
	}
	return "";
}