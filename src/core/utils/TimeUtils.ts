export const minutesDisplay = function(minutes: number): string {
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

export const millisecondsToMinutes = (milliseconds: number) => Math.round(milliseconds / 60000);

export const minutesToMilliseconds = (minutes: number) => minutes * 60000;

export const hoursToMilliseconds = (hours: number) => hours * 3600000;

export const hoursToMinutes = (hours: number) => hours * 60;

export const millisecondsToHours = (milliseconds: number) => milliseconds / 3600000;

export const datesAreOnSameDay = (first: Date, second: Date) =>
	first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

export const finishInTimeDisplay = (finishDate: Date) => "<t:" + Math.floor(finishDate.getTime() / 1000) + ":R>";