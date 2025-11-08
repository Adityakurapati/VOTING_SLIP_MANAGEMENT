import re

with open("input.json", "r", encoding="utf-8") as f:
    data = f.read()

pattern = r'\{\s*"क्रमांक":\s*"([^"]+)",'
count = 1

def replacer(match):
    global count
    new_text = f'"voter{count}": {{\n    "क्रमांक": "{match.group(1)}",'
    count += 1
    return new_text

new_data = re.sub(pattern, replacer, data)

with open("output.json", "w", encoding="utf-8") as f:
    f.write(new_data)

print("✅ Done! Check output.json")
