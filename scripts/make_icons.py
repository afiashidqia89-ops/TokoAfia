#!/usr/bin/env python3
"""Generate ikon PWA LakuKu (logo: grafik batang + panah naik, oranye)."""

from PIL import Image, ImageDraw

ORANGE_TOP = (251, 146, 60)   # orange-400
ORANGE_BOT = (234, 88, 12)    # orange-600
WHITE = (255, 255, 255)

SS = 4  # supersampling untuk hasil halus


def build_base(size: int, rounded: bool) -> Image.Image:
    big = size * SS
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Latar gradasi vertikal orange
    for y in range(big):
        t = y / max(big - 1, 1)
        r = int(ORANGE_TOP[0] + (ORANGE_BOT[0] - ORANGE_TOP[0]) * t)
        g = int(ORANGE_TOP[1] + (ORANGE_BOT[1] - ORANGE_TOP[1]) * t)
        b = int(ORANGE_TOP[2] + (ORANGE_BOT[2] - ORANGE_TOP[2]) * t)
        d.line([(0, y), (big, y)], fill=(r, g, b, 255))

    if rounded:
        mask = Image.new('L', (big, big), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=255)
        img.putalpha(mask)

    # Zona aman untuk maskable: gambar di area tengah 72%
    scale = 0.72 if not rounded else 1.0
    inner = big * scale
    offset = (big - inner) / 2

    # Tiga batang naik (putih, ujung membulat)
    bar_w = inner * 0.13
    gap = inner * 0.09
    base_y = offset + inner * 0.80
    heights = [inner * 0.22, inner * 0.36, inner * 0.50]
    total_w = bar_w * 3 + gap * 2
    x0 = offset + (inner - total_w) / 2

    for i, h in enumerate(heights):
        x = x0 + i * (bar_w + gap)
        d.rounded_rectangle(
            [x, base_y - h, x + bar_w, base_y],
            radius=bar_w / 2,
            fill=WHITE,
        )

    # Panah naik di atas batang (garis + kepala panah)
    line_w = int(inner * 0.055)
    p1 = (x0 + bar_w * 0.5, base_y - heights[0] - inner * 0.10)
    p2 = (x0 + total_w - bar_w * 0.5, base_y - heights[2] - inner * 0.22)
    d.line([p1, p2], fill=WHITE, width=line_w)
    # Kepala panah
    ah = inner * 0.10
    aw = inner * 0.075
    import math
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    left = (
        p2[0] - ah * math.cos(ang) + aw * math.sin(ang),
        p2[1] - ah * math.sin(ang) - aw * math.cos(ang),
    )
    right = (
        p2[0] - ah * math.cos(ang) - aw * math.sin(ang),
        p2[1] - ah * math.sin(ang) + aw * math.cos(ang),
    )
    d.polygon([p2, left, right], fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


def main():
    import os
    out_dir = '/home/z/my-project/public/icons'
    os.makedirs(out_dir, exist_ok=True)

    build_base(192, rounded=True).save(f'{out_dir}/icon-192.png')
    build_base(512, rounded=True).save(f'{out_dir}/icon-512.png')
    build_base(512, rounded=False).save(f'{out_dir}/maskable-512.png')

    # Favicon aplikasi (src/app/icon.png)
    build_base(256, rounded=True).save('/home/z/my-project/src/app/icon.png')
    print('Ikon PWA selesai dibuat di', out_dir)


if __name__ == '__main__':
    main()
