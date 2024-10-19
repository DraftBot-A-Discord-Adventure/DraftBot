const emojiUnicodeMap: Record<string, string> = {
	"⛰": ":mountain:"
};

export function translateEmojiToDiscord(emoji: string): string {
	if (emojiUnicodeMap[emoji]) {
		return emojiUnicodeMap[emoji];
	}
	return emoji;
}
