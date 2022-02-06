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
