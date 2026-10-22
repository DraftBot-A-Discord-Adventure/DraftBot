"""Fail when emojis are found in commit messages or in files.

Usage:
    check-emojis.py commits <base_sha> <head_sha>
    check-emojis.py files <path> [<path> ...]
"""
import re
import subprocess
import sys

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F000-\U0001FAFF"  # pictographs, emoticons, transport, flags, supplemental symbols
    "\u2300-\u23FF"          # misc technical (hourglass, alarm clock, play buttons...)
    "\u2600-\u27BF"          # misc symbols and dingbats
    "\u2B00-\u2BFF"          # stars, big arrows and squares
    "\uFE0F"                 # emoji variation selector
    "]"
)


def find_emojis(text: str) -> list[str]:
    return sorted(set(EMOJI_PATTERN.findall(text)))


def check_commits(base: str, head: str) -> int:
    log = subprocess.run(
        ["git", "log", "--no-merges", "--format=%H%x00%B%x1e", f"{base}..{head}"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout

    offenders = 0
    for entry in filter(str.strip, log.split("\x1e")):
        sha, message = entry.strip().split("\x00", 1)
        emojis = find_emojis(message)
        if emojis:
            offenders += 1
            subject = message.strip().splitlines()[0] if message.strip() else ""
            print(f"::error title=Emoji in commit message::{sha[:10]} \"{subject}\" contains {' '.join(emojis)}")

    if offenders:
        print(f"\n{offenders} commit(s) contain emojis. Please reword them (git rebase -i) without emojis.")
        return 1
    print("No emoji found in the commit messages.")
    return 0


def check_files(paths: list[str]) -> int:
    offenders = 0
    for path in paths:
        with open(path, encoding="utf-8") as file:
            for line_number, line in enumerate(file, 1):
                emojis = find_emojis(line)
                if emojis:
                    offenders += 1
                    print(f"::error file={path},line={line_number},title=Hardcoded emoji::{' '.join(emojis)} must be replaced by an {{emote:...}} interpolation")

    if offenders:
        print(f"\n{offenders} line(s) contain hardcoded emojis. Use {{emote:path}} interpolations with CrowniclesIcons instead.")
        return 1
    print(f"No emoji found in {len(paths)} file(s).")
    return 0


def main() -> int:
    if len(sys.argv) == 4 and sys.argv[1] == "commits":
        return check_commits(sys.argv[2], sys.argv[3])
    if len(sys.argv) >= 3 and sys.argv[1] == "files":
        return check_files(sys.argv[2:])
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
