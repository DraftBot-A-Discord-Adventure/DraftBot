/**
 * Display a time in a human readable format
 * @param minutes - the time in minutes
 */
export const minutesDisplay = function(minutes: number): string {
	minutes = Math.floor(minutes);
	const hours = Math.floor(minutes / 60);
	minutes %= 60;

	let display;
	if (hours > 0) {
		display = hours + " H " + minutes + " Min";
	}
	else if (minutes !== 0) {
		display = minutes + " Min";
	}
	else {
		display = "< 1 Min";
	}

	return display;
};

/**
 * get a date value of tomorrow
 */
export const getTomorrowMidnight = function() {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow;
};

/**
 * get the day number
 */
export const getDayNumber = (): number => Math.floor(new Date().valueOf() / 8.64e7);

/**
 * convert milliseconds to minutes
 * @param milliseconds
 */
export const millisecondsToMinutes = (milliseconds: number): number => Math.round(milliseconds / 60000);

/**
 * convert minutes to seconds
 * @param minutes
 */
export const minutesToMilliseconds = (minutes: number): number => minutes * 60000;

/**
 * convert hours to milliseconds
 * @param hours
 */
export const hoursToMilliseconds = (hours: number): number => hours * 3600000;

/**
 * convert hours to minutes
 * @param hours
 */
export const hoursToMinutes = (hours: number): number => hours * 60;

/**
 * convert minutes to hours
 * @param milliseconds
 */
export const millisecondsToHours = (milliseconds: number): number => milliseconds / 3600000;

/**
 * check if two dates are the same day
 * @param first - first date
 * @param second - second date
 */
export const datesAreOnSameDay = (first: Date, second: Date): boolean =>
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth() &&
	first.getDate() === second.getDate();

/**
 * Display the time before given date in a human readable format
 * @param finishDate - the date to use
 */
export const finishInTimeDisplay = (finishDate: Date): string => "<t:" + Math.floor(finishDate.valueOf() / 1000).toString() + ":R>";
finishInTimeDisplay(new Date());
export const getNextSundayMidnight = (): number => {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setDate(now.getDate() + (7 - now.getDay()) % 7);
	dateOfReset.setHours(23, 59, 59);
	let dateOfResetTimestamp = dateOfReset.valueOf();
	while (dateOfResetTimestamp < now.valueOf()) {
		dateOfResetTimestamp += 1000 * 60 * 60 * 24 * 7;
	}
	return dateOfResetTimestamp;
};

/**
 * check if the reset is being done currently
 */
export const resetIsNow = (): boolean => getNextSundayMidnight() - Date.now() <= 1000 * 5 * 60;

/**
 * parse the time difference between two dates
 * @param date1 - first date
 * @param date2 - second date
 * @param language - the language to use
 */
export const parseTimeDifference = function(date1: number, date2: number, language: string): string {
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
};

/**
 * get the date of the next day at 2 am
 */
export const getNextDay2AM = function() {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setHours(1, 59, 59);
	if (dateOfReset < now) {
		dateOfReset.setDate(dateOfReset.getDate() + 1);
	}
	return new Date(dateOfReset);
};