import {Language, LANGUAGE} from "../Language";

/**
 * Get the elements to display the remaining time in the given language
 * @param language
 */ // Todo: je crois que ya moyen de gérer avec i18n
function getMinutesDisplayStringConstants(language: string): {
	hoursDisplay: string;
	minutesDisplay: string;
	secondsDisplay: string;
	plural: string;
	linkWord: string
} {
	return language === "" ? {
		hoursDisplay: "H",
		minutesDisplay: "Min",
		secondsDisplay: "s",
		linkWord: " ",
		plural: ""
	} : language === LANGUAGE.FRENCH ? {
		hoursDisplay: "heure",
		minutesDisplay: "minute",
		secondsDisplay: "seconde",
		linkWord: " et ",
		plural: "s"
	} : {
		hoursDisplay: "hour",
		minutesDisplay: "minute",
		secondsDisplay: "second",
		linkWord: " and ",
		plural: "s"
	};
}

/**
 * Get the current date for logging purposes
 */
export function getDateLogs(): number {
	return Math.trunc(Date.now() / 1000);
}

/**
 * Convert a date to a timestamp for logging purposes
 * @param date
 */
export function dateToLogs(date: Date): number {
	return Math.trunc(date.valueOf() / 1000);
}

/**
 * Get a date value of tomorrow
 */
export function getTomorrowMidnight(): Date {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow;
}

/**
 * Get a date value of today at midnight
 */
export function getTodayMidnight(): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

/**
 * Get the day number
 */
export function getDayNumber(): number {
	return Math.floor(new Date().valueOf() / 8.64e7);
}

/**
 * Convert milliseconds to minutes
 * @param milliseconds
 */
export function millisecondsToMinutes(milliseconds: number): number {
	return Math.round(milliseconds / 60000);
}

/**
 * Convert minutes to seconds
 * @param minutes
 */
export function minutesToMilliseconds(minutes: number): number {
	return minutes * 60000;
}

/**
 * Convert hours to milliseconds
 * @param hours
 */
export function hoursToMilliseconds(hours: number): number {
	return hours * 3600000;
}

/**
 * Convert hours to minutes
 * @param hours
 */
export function hoursToMinutes(hours: number): number {
	return hours * 60;
}

/**
 * Convert minutes to hours
 * @param minutes
 */
export function minutesToHours(minutes: number): number {
	return minutes / 60;
}

/**
 * Convert minutes to hours
 * @param milliseconds
 */
export function millisecondsToHours(milliseconds: number): number {
	return milliseconds / 3600000;
}

/**
 * Convert milliseconds to seconds
 * @param milliseconds
 */
export function millisecondsToSeconds(milliseconds: number): number {
	return milliseconds / 1000;
}

/**
 * Convert hours to seconds
 * @param hours
 */
export function hoursToSeconds(hours: number): number {
	return hours * 3600;
}

/**
 * Check if two dates are the same day
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
	return `<t:${Math.floor(millisecondsToSeconds(finishDate.valueOf())).toString()}:R>`;
}

/**
 * Display the time before given date in a human-readable format
 * @param finishDate - the date to use
 */
export function dateDisplay(finishDate: Date): string {
	return `<t:${Math.floor(millisecondsToSeconds(finishDate.valueOf())).toString()}:F>`;
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
		dateOfResetTimestamp += hoursToMilliseconds(24 * 7);
	}
	return dateOfResetTimestamp;
}

/**
 * Get the date from one day ago as a timestamp
 */
export function getOneDayAgo(): number {
	return Date.now() - hoursToMilliseconds(24);
}

/**
 * Returns true if we are currently on a sunday
 */
export function todayIsSunday(): boolean {
	const now = new Date();
	return now.getDay() === 0;
}

/**
 * Get the next season's start
 */
export function getNextSaturdayMidnight(): number {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setDate(now.getDate() + (6 - now.getDay()) % 7);
	dateOfReset.setHours(23, 59, 59);
	let dateOfResetTimestamp = dateOfReset.valueOf();
	while (dateOfResetTimestamp < now.valueOf()) {
		dateOfResetTimestamp += 1000 * 60 * 60 * 24 * 7;
	}
	return dateOfResetTimestamp;
}

/**
 * Check if the reset is being done currently
 */
export function resetIsNow(): boolean {
	return getNextSundayMidnight() - Date.now() <= minutesToMilliseconds(5);
}

/**
 * Check if the reset of the season end is being done currently
 */
export function seasonEndIsNow(): boolean {
	return getNextSaturdayMidnight() - Date.now() <= minutesToMilliseconds(20);
}

/**
 * Parse the time difference between two dates
 * @param date1 - first date
 * @param date2 - second date
 * @param language - the language to use
 */
export function parseTimeDifferenceFooter(date1: number, date2: number, language: string): string {
	if (date1 > date2) {
		date1 = [date2, date2 = date1][0];
	}
	let seconds = Math.floor((date2.valueOf() - date1.valueOf()) / 1000);
	let parsed = "";
	const days = Math.floor(seconds / (24 * 60 * 60));
	if (days > 0) {
		parsed += days + (language === LANGUAGE.FRENCH ? " J " : " D ");
		seconds -= days * 24 * 60 * 60;
	}

	const hours = Math.floor(seconds / (60 * 60));
	const timeConstants = getMinutesDisplayStringConstants("");
	if (hours !== 0) {
		parsed += `${hours} ${timeConstants.hoursDisplay} `;
	}
	seconds -= hours * 60 * 60;
	const minutes = Math.floor(seconds / 60);
	parsed += `${minutes} ${timeConstants.minutesDisplay} `;
	seconds -= minutes * 60;
	parsed += `${seconds} ${timeConstants.secondsDisplay}`;
	return parsed;
}

/**
 * Parse the time remaining before a date.
 * @param date
 */
export function printTimeBeforeDate(date: number): string {
	date /= 1000;
	return `<t:${Math.floor(date).valueOf()
		.toString()}:R>`;
}

/**
 * Get the date of the next day at 2 am
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

/**
 * Get the date of now minus the given number of hours
 * @param hours - the number of hours to remove
 */
export function getTimeFromXHoursAgo(hours: number): Date {
	const time = new Date();
	time.setHours(time.getHours() - hours);
	return time;
}

/**
 * Display a time in a human-readable format
 * @param minutes - the time in minutes
 * @param language
 */
export function minutesDisplay(minutes: number, language: Language = LANGUAGE.DEFAULT_LANGUAGE): string {
	const hours = Math.floor(minutesToHours(minutes));
	minutes = Math.floor(minutes % 60);
	const displayConstantValues = getMinutesDisplayStringConstants(language);
	const display = [
		hours > 0 ? `${hours} ${displayConstantValues.hoursDisplay}${hours > 1 ? displayConstantValues.plural : ""}` : "",
		minutes > 0 ? `${minutes} ${displayConstantValues.minutesDisplay}${minutes > 1 ? displayConstantValues.plural : ""}` : ""
	].filter(v => v !== "").join(displayConstantValues.linkWord);
	return display === "" ? "< 1 Min" : display;
}

/**
 * Get the week number of the year of the given date
 * @param date
 */
export function getWeekNumber(date: Date): number {
	const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
	const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
	return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}