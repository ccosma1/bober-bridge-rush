import pathlib
import sys

root = pathlib.Path(__file__).resolve().parents[1]
banned = [
    "last z",
    "lastz",
    "zombie",
    "wallet",
    "metamask",
    "nintendo",
    "mario",
    "rainbow road",
    "crypto",
    "kart",
]
skip = {".git"}
bad = []
for path in root.rglob("*"):
    if not path.is_file():
        continue
    if any(part in skip for part in path.parts):
        continue
    if path.name == "check.py":
        continue
    if path.suffix.lower() not in {".html", ".js", ".css", ".md", ".json", ".py", ".bat"}:
        continue
    text = path.read_text(encoding="utf-8", errors="ignore").lower()
    for word in banned:
        if word in text:
            bad.append(f"{path.relative_to(root)}: {word}")
if bad:
    print("\n".join(bad))
    sys.exit(1)
print("check ok")
