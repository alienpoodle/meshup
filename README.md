# MeshUp: Image to Plastic Canvas Converter

MeshUp is a browser-based tool for turning photos into stitch-friendly needlepoint patterns for plastic canvas.

The app runs fully client-side and is suitable for GitHub Pages hosting.

## Features

### Pattern Controls
- Stitch Width slider to define stitch count across the pattern
- Max Colors slider (2–20) for yarn-friendly palette reduction — hard-capped at 20 colours; any excess tones are automatically merged into their nearest counterpart within the 20
- Sharpness slider to reduce blur during downsampling
- Mesh presets: 7, 10, and 14 count
- Grid toggle and Grid Contrast slider for readability
- Printable Mode preview with numbered symbols on the pattern
- Zoom controls (50 % – 300 %) via toolbar buttons or mouse wheel

### Image Edit Menu
- Rotate Left / Rotate Right
- Flip Horizontal / Flip Vertical
- Reset Image to original upload
- Background removal with hover preview and sensitivity control
- Background color replacement
- Manual eraser tool with brush-size control and live brush cursor

### Thread Mapping
- Each palette colour is automatically matched to its nearest DMC thread using squared Euclidean distance in RGB space
- The yarn palette panel displays each colour's swatch, hex value, DMC code, full thread name, and stitch count
- The palette is shown as a borderless responsive grid — no scrolling required
- The printable export color key includes DMC code, thread name, and stitch count per row with full word-wrap so no text is clipped

### Stats and Validation
- Live stitch dimensions and physical size in inches
- 7-count sheet-fit validation against standard 10.5" × 13.5" canvas size
- Warning highlight when pattern exceeds a standard 7-count sheet

### Export
- Export Printable Sheet (PNG)
- Includes:
	- Number-only stitch grid (white background, black numbers — no colour fill)
	- Stitch count, mesh count, physical dimensions in the header
	- Numbered colour key with DMC thread code, name, and stitch count per entry
	- Word-wrapped key rows so long thread names are never clipped
	- Major grid lines every 10 stitches for easy counting

## How to Use

1. Upload an image in the Pattern tab.
2. Set Stitch Width, Max Colors (up to 20), Sharpness, and Mesh Count.
3. Switch to Image Edit for cleanup (background tools, orientation, eraser).
4. Review the yarn palette — each swatch shows its matched DMC thread and stitch count.
5. Use Printable Mode to preview numbered symbols on the canvas.
6. Export Printable Sheet to download a pattern-ready PNG with the full colour key.


## Notes

- PNG uploads are recommended for cleaner stitch edges and fewer compression artifacts.
- All processing is done in-browser; no server-side image processing is required.
- The DMC thread database covers 57 colours. The nearest match is selected automatically — always verify thread selections against a physical colour card before purchasing.
