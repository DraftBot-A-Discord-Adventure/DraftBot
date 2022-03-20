/**
 * remove discord formatting scrap from usernames
 * @param username
 */
import {Constants} from "../Constants";

export const escapeUsername = function(username: string) {
	let fixedName = username.replace(/[*`_|]/g, "");
	if (fixedName === "") {
		fixedName = ".";
	}
	return fixedName;
};

export const progressBar = (value: number, maxValue: number) => {
	let percentage = value / maxValue; // Calculate the percentage of the bar
	if (percentage < 0 || isNaN(percentage) || percentage === Infinity) {
		percentage = 0;
	}
	if (percentage > 1) {
		percentage = 1;
	}
	const progress = Math.round(Constants.MESSAGES.PROGRESS_BAR_SIZE * percentage); // Calculate the number of square caracters to fill the progress side.
	const emptyProgress = Constants.MESSAGES.PROGRESS_BAR_SIZE - progress; // Calculate the number of dash caracters to fill the empty progress side.

	const progressText = "▇".repeat(progress); // Repeat is creating a string with progress * caracters in it
	const emptyProgressText = "—".repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
	const percentageText = Math.floor(percentage * 100) + "%"; // Displaying the percentage of the bar

	return "```[" + progressText + emptyProgressText + "]" + percentageText + "```"; // Creating the bar
}