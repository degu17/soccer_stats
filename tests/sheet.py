# Contact sheet of playtest screenshots: python tests/sheet.py <viewport> <out> [start] [end]
import sys, glob
from PIL import Image
vp, out = sys.argv[1], sys.argv[2]
a = int(sys.argv[3]) if len(sys.argv) > 3 else 0
b = int(sys.argv[4]) if len(sys.argv) > 4 else 99
fs = sorted(glob.glob(f"tests/shots/{vp}/*.png"))[a:b]
ims = [Image.open(f).convert("RGB") for f in fs]
h = 640
ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
cols = 4 if ims[0].width < 500 else 2
rows = (len(ims) + cols - 1) // cols
W = max(im.width for im in ims)
s = Image.new("RGB", (cols * (W + 10), rows * (h + 10)), "white")
for i, im in enumerate(ims):
    s.paste(im, ((i % cols) * (W + 10), (i // cols) * (h + 10)))
s.save(out)
