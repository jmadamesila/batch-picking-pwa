#!/usr/bin/env python3
"""
Generate PNG icons (192x192 and 512x512) with a gradient background
and bold block letters "BPR". Pure-Python PNG writer (no external deps).
"""
import os, struct, zlib

def write_png(path, width, height, pixels):
    # pixels: list of rows, each row is list of (r,g,b,a) tuples
    def chunk(t, d):
        return (struct.pack('>I', len(d)) + t + d +
                struct.pack('>I', zlib.crc32(t + d) & 0xffffffff))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    # filter 0 per scanline
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for r,g,b,a in pixels[y]:
            raw += bytes((r,g,b,a))
    idat = zlib.compress(bytes(raw), 9)
    with open(path, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))

def make_img(size):
    w = h = size
    # gradient background (indigo -> cyan)
    def grad(x, y):
        t = (x + y) / (w + h)
        # indigo 0x6366F1 -> (99,102,241), cyan 0x38BDF8 -> (56,189,248)
        c1 = (99,102,241)
        c2 = (56,189,248)
        r = int(c1[0]*(1-t) + c2[0]*t)
        g = int(c1[1]*(1-t) + c2[1]*t)
        b = int(c1[2]*(1-t) + c2[2]*t)
        return (r,g,b,255)
    px = [[grad(x,y) for x in range(w)] for y in range(h)]

    # Draw rounded rectangle card to soften the square
    pad = int(size*0.06)
    radius = int(size*0.14)
    bg = (0,0,0,0)  # already filled by gradient

    # Draw letters B P R as white blocks
    white = (255,255,255,255)
    # Layout columns
    margin = int(size*0.12)
    gutter = int(size*0.06)
    avail = w - margin*2 - gutter*2
    col_w = avail // 3
    top = int(size*0.22)
    bottom = int(size*0.78)
    stroke = max(2, int(size*0.08))

    def rect(x0,y0,x1,y1,col):
        x0=max(0,x0); y0=max(0,y0); x1=min(w,x1); y1=min(h,y1)
        for yy in range(y0,y1):
            row = px[yy]
            for xx in range(x0,x1):
                row[xx] = col

    def draw_B(x):
        # Vertical spine
        rect(x, top, x+stroke, bottom, white)
        # Top bar
        rect(x, top, x+col_w, top+stroke, white)
        # Middle bar
        m = (top+bottom)//2
        rect(x, m-stroke//2, x+col_w-2, m+stroke//2, white)
        # Bottom bar
        rect(x, bottom-stroke, x+col_w, bottom, white)
        # Curves approximated by vertical caps on the right
        rect(x+col_w-stroke, top, x+col_w, m, white)
        rect(x+col_w-stroke, m, x+col_w, bottom, white)

    def draw_P(x):
        rect(x, top, x+stroke, bottom, white)
        rect(x, top, x+col_w, top+stroke, white)
        mid = (top+bottom)//2
        rect(x, mid-stroke//2, x+col_w-2, mid+stroke//2, white)
        rect(x+col_w-stroke, top, x+col_w, mid, white)

    def draw_R(x):
        rect(x, top, x+stroke, bottom, white)
        rect(x, top, x+col_w, top+stroke, white)
        mid = (top+bottom)//2
        rect(x, mid-stroke//2, x+col_w-2, mid+stroke//2, white)
        rect(x+col_w-stroke, top, x+col_w, mid, white)
        # Diagonal leg
        leg_w = stroke
        for i in range(bottom-mid):
            xx0 = x + col_w - stroke - i//2
            rect(xx0, mid+i, xx0+leg_w, mid+i+1, white)

    start_x = margin
    draw_B(start_x)
    draw_P(start_x + col_w + gutter)
    draw_R(start_x + 2*(col_w + gutter))

    return px

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(here, '..'))
    icons = os.path.join(root, 'icons')
    os.makedirs(icons, exist_ok=True)
    out192 = os.path.join(icons, 'icon-192.png')
    out512 = os.path.join(icons, 'icon-512.png')
    for size, outp in [(192,out192),(512,out512)]:
        px = make_img(size)
        write_png(outp, size, size, px)
        print('wrote', outp)

if __name__ == '__main__':
    main()

