import {Constants} from "../Constants";

/**
 * Get the elements to display a remaining time in the given language
 * @param language
 */
function getMinutesDisplayStringConstants(language: string): { hoursDisplay: string; minutesDisplay: string; plural: string; linkWord: string } {
	return language === "" ? {
		hoursDisplay: "H",
		minutesDisplay: "Min",
		linkWord: " ",
		plural: ""
	} : language === Constants.LANGUAGE.FRENCH ? {
		hoursDisplay: "heure",
		minutesDisplay: "minute",
		linkWord: " et ",
		plural: "s"
	} : {
		hoursDisplay: "hour",
		minutesDisplay: "minute",
		linkWord: " and ",
		plural: "s"
	};
}

/**
 * Display a time in a human-readable format
 * @param minutes - the time in minutes
 * @param language
 */
export function minutesDisplay(minutes: number, language = ""): string {
	const hours = Math.floor(minutes / 60);
	minutes = Math.floor(minutes % 60);
	const displayConstantValues = getMinutesDisplayStringConstants(language);
	const display = [
		hours > 0 ? `${hours} ${displayConstantValues.hoursDisplay}${hours > 1 ? displayConstantValues.plural : ""}` : "",
		minutes > 0 ? `${minutes} ${displayConstantValues.minutesDisplay}${minutes > 1 ? displayConstantValues.plural : ""}` : ""
	].filter(v => v !== "").join(displayConstantValues.linkWord);
	return display === "" ? "< 1 Min" : display;
}

/**
 * get a date value of tomorrow
 */
export function getTomorrowMidnight(): Date {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow;
}

/**
 * get the day number
 */
export function getDayNumber(): number {
	return Math.floor(new Date().valueOf() / 8.64e7);
}

/**
 * convert milliseconds to minutes
 * @param milliseconds
 */
export function millisecondsToMinutes(milliseconds: number): number {
	return Math.round(milliseconds / 60000);
}

/**
 * convert minutes to seconds
 * @param minutes
 */
export function minutesToMilliseconds(minutes: number): number {
	return minutes * 60000;
}

/**
 * convert hours to milliseconds
 * @param hours
 */
export function hoursToMilliseconds(hours: number): number {
	return hours * 3600000;
}

/**
 * convert hours to minutes
 * @param hours
 */
export function hoursToMinutes(hours: number): number {
	return hours * 60;
}

/**
 * convert minutes to hours
 * @param milliseconds
 */
export function millisecondsToHours(milliseconds: number): number {
	return milliseconds / 3600000;
}

/**
 * check if two dates are the same day
 * @param first - first date
 * @param second - second date
 */
export function datesAreOnSameDay(first: Date, second: Date): boolean {
	return first.getFullYear() === second.getFullYear() &&
		first.getMonth() === second.getMonth() &&
		first.getDate() === second.getDate();
}

/**
 * Display the time before given date in a human-readable format
 * @param finishDate - the date to use
 */
export function finishInTimeDisplay(finishDate: Date): string {
	return `<t:${Math.floor(finishDate.valueOf() / 1000).toString()}:R>`;
}

/**
 * Get the next week's start
 */
export function getNextSundayMidnight(): number {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setDate(now.getDate() + (7 - now.getDay()) % 7);
	dateOfReset.setHours(23, 59, 59);
	let dateOfResetTimestamp = dateOfReset.valueOf();
	while (dateOfResetTimestamp < now.valueOf()) {
		dateOfResetTimestamp += 1000 * 60 * 60 * 24 * 7;
	}
	return dateOfResetTimestamp;
}

/**
 * check if the reset is being done currently
 */
export function resetIsNow(): boolean {
	return getNextSundayMidnight() - Date.now() <= 1000 * 5 * 60;
}

/**
 * parse the time difference between two dates
 * @param date1 - first date
 * @param date2 - second date
 * @param language - the language to use
 */
export function parseTimeDifference(date1: number, date2: number, language: string): string {
	if (date1 > date2) {
		date1 = [date2, date2 = date1][0];
	}
	let seconds = Math.floor((date2.valueOf() - date1.valueOf()) / 1000);
	let parsed = "";
	const days = Math.floor(seconds / (24 * 60 * 60));
	if (days > 0) {
		parsed += days + (language === "fr" ? " J " : " D ");
		seconds -= days * 24 * 60 * 60;
	}

	const hours = Math.floor(seconds / (60 * 60));
	if (hours !== 0) {
		parsed += hours + " H ";
	}
	seconds -= hours * 60 * 60;
	const minutes = Math.floor(seconds / 60);
	parsed += minutes + " Min ";
	seconds -= minutes * 60;
	parsed += seconds + " s";
	return parsed;
}

/**
 * get the date of the next day at 2 am
 */
export function getNextDay2AM(): Date {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setHours(1, 59, 59);
	if (dateOfReset < now) {
		dateOfReset.setDate(dateOfReset.getDate() + 1);
	}
	return new Date(dateOfReset);
}