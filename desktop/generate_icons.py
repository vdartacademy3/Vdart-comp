import zlib
import struct
import os

def create_png(width, height, draw_fn):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter byte: None
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(bytes(raw_data)))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def vcamp_icon(x, y, w, h):
    # Normalized coords (-1 to 1)
    nx = (x / w) * 2.0 - 1.0
    ny = (y / h) * 2.0 - 1.0
    dist = (nx**2 + ny**2)**0.5

    # Circular badge background
    if dist > 0.95:
        return 0, 0, 0, 0 # Transparent
    
    # Outer cyan ring
    if 0.85 < dist <= 0.95:
        return 0, 242, 254, 255 # Glowing Cyan #00f2fe

    # Dark navy background
    base_r, base_g, base_b = 15, 23, 42

    # Glowing 'V' geometry
    # V shape: two thick lines meeting at bottom
    # Bottom point: (0, 0.55), Left top: (-0.45, -0.45), Right top: (0.45, -0.45)
    in_v = False
    
    # Left stroke of V
    if -0.55 < nx < 0.1 and -0.55 < ny < 0.65:
        # Distance from line segment (-0.45, -0.45) to (0, 0.55)
        # Line equation: y - 0.55 = ( (0.55 - (-0.45)) / (0 - (-0.45)) ) * x = (1.0 / 0.45) * x = 2.22 * x
        # x_line = (y - 0.55) / 2.22
        x_target = (ny - 0.55) / 2.22
        if abs(nx - x_target) < 0.14 and ny <= 0.55 and ny >= -0.45:
            in_v = True

    # Right stroke of V
    if -0.1 < nx < 0.55 and -0.55 < ny < 0.65:
        x_target = -(ny - 0.55) / 2.22
        if abs(nx - x_target) < 0.14 and ny <= 0.55 and ny >= -0.45:
            in_v = True

    if in_v:
        return 0, 242, 254, 255 # Glowing Cyan

    # Glow around V
    v_dist = min(
        abs(nx - ((ny - 0.55) / 2.22)),
        abs(nx + ((ny - 0.55) / 2.22))
    )
    if v_dist < 0.25 and ny <= 0.6 and ny >= -0.5:
        alpha = int((1.0 - (v_dist / 0.25)) * 180)
        return 6, 182, 212, alpha

    return base_r, base_g, base_b, 255

def create_ico(png_data):
    # Standard ICO containing a single PNG image
    header = struct.pack('<HHH', 0, 1, 1)
    w = 32
    h = 32
    entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(png_data), 22)
    return header + entry + png_data

icons_dir = r'D:\Aathil\sentiment analysis\VCamp\desktop\src-tauri\icons'
os.makedirs(icons_dir, exist_ok=True)

png32 = create_png(32, 32, vcamp_icon)
png128 = create_png(128, 128, vcamp_icon)
png512 = create_png(512, 512, vcamp_icon)

with open(os.path.join(icons_dir, '32x32.png'), 'wb') as f:
    f.write(png32)
with open(os.path.join(icons_dir, '128x128.png'), 'wb') as f:
    f.write(png128)
with open(os.path.join(icons_dir, '128x128@2x.png'), 'wb') as f:
    f.write(png512)
with open(os.path.join(icons_dir, 'icon.png'), 'wb') as f:
    f.write(png512)
with open(os.path.join(icons_dir, 'icon.ico'), 'wb') as f:
    f.write(create_ico(png32))

print('Icons created successfully!')
