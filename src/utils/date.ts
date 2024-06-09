export function convertToUTC7(timeString: string | number | Date) {
	const date = new Date(timeString);
	const utc7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
	return utc7.toISOString();
}
