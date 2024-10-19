const emojiUnicodeMap: Record<string, string> = {
	"⛰": ":mountain:"
};

/**
 * Translates an emoji to its Discord equivalent when necessary
 * @param emoji
 */
export function translateEmojiToDiscord(emoji: string): string {
	if (emojiUnicodeMap[emoji]) {
		return emojiUnicodeMap[emoji];
	}
	return emoji;
}
