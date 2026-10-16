# Downloads NYC 2018 orthophoto tiles (© City of New York, CC BY 4.0) for Lower Manhattan and stitches one mosaic.
# Usage: <venv python> scripts/fetch-ortho.py  → brief/data/ortho/mosaic-z{Z}.png + bounds json
import math, json, os, sys, time, urllib.request
from io import BytesIO
from PIL import Image
Z = int(os.environ.get('Z', 16))
S, W, N, E = 40.680, -74.050, 40.735, -73.965   # harbour around the tip, both shores
def tile(lat, lon, z):
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)
def lonlat(x, y, z):
    n = 2 ** z
    return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
x0, y0 = tile(N, W, Z); x1, y1 = tile(S, E, Z)
out = Image.new('RGB', ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256), (40, 80, 120))
cache = f'brief/data/ortho/z{Z}'; os.makedirs(cache, exist_ok=True)
for x in range(x0, x1 + 1):
    for y in range(y0, y1 + 1):
        p = f'{cache}/{x}_{y}.png'
        if not os.path.exists(p):
            req = urllib.request.Request(f'https://maps{1 + (x + y) % 4}.nyc.gov/xyz/1.0.0/photo/2018/{Z}/{x}/{y}.png8', headers={'User-Agent': 'mstock-global-prototype/1.0'})
            try:
                open(p, 'wb').write(urllib.request.urlopen(req, timeout=30).read()); time.sleep(0.05)
            except Exception as e:
                print('miss', x, y, e); continue
        try: out.paste(Image.open(p).convert('RGB'), ((x - x0) * 256, (y - y0) * 256))
        except Exception as e: print('bad', p, e)
nw = lonlat(x0, y0, Z); se = lonlat(x1 + 1, y1 + 1, Z)
out.save(f'brief/data/ortho/mosaic-z{Z}.png')
json.dump({'west': nw[0], 'north': nw[1], 'east': se[0], 'south': se[1], 'w': out.width, 'h': out.height}, open(f'brief/data/ortho/mosaic-z{Z}.json', 'w'))
print('tiles', (x1 - x0 + 1) * (y1 - y0 + 1), 'mosaic', out.size)
