/**
 * remove discord formatting scrap from usernames
 * @param username
 */
export const escapeUsername = function(username: string) {
	let fixedName = username.replace(/[*`_|]/g, "");
	if (fixedName === "") {
		fixedName = ".";
	}
	return fixedName;
};

/**
 * Check if a name is valid
 * @param name - the name to check
 * @param minLength
 * @param maxLength
 */
export const checkNameString = function(name :string, minLength: number, maxLength:number) {
	const regexAllowed = RegExp(/^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]+$/);
	const regexSpecialCases = RegExp(/^[0-9 ]+$|( {2})+/);
	return regexAllowed.test(name) && !regexSpecialCases.test(name) && name.length >= minLength && name.length <= maxLength;
};
