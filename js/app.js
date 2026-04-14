const imageInput = document.getElementById('image-input');
const gridSizeInput = document.getElementById('grid-size');
const colorLimitInput = document.getElementById('color-limit');
const meshTypeInput = document.getElementById('mesh-type');
const widthValLabel = document.getElementById('width-val');
const colorLimitValLabel = document.getElementById('color-limit-val');
const canvas = document.getElementById('display-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const emptyState = document.getElementById('empty-state');
const statStitches = document.getElementById('stat-stitches');
const statInches = document.getElementById('stat-inches');
const paletteGrid = document.getElementById('color-palette');
const colorCountLabel = document.getElementById('color-count');
const downloadBtn = document.getElementById('download-btn');

let originalImage = null;

// Initialize
imageInput.addEventListener('change', handleImageUpload);
gridSizeInput.addEventListener('input', updateProject);
colorLimitInput.addEventListener('input', updateProject);
meshTypeInput.addEventListener('change', updateProject);
downloadBtn.addEventListener('click', downloadPattern);

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage = new Image();
        originalImage.onload = () => {
            emptyState.style.display = 'none';
            canvas.style.display = 'block';
            updateProject();
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateProject() {
    if (!originalImage) return;

    const stitchWidth = parseInt(gridSizeInput.value);
    widthValLabel.textContent = stitchWidth;

    const maxColors = parseInt(colorLimitInput.value);
    colorLimitValLabel.textContent = maxColors;

    const aspectRatio = originalImage.height / originalImage.width;
    const stitchHeight = Math.round(stitchWidth * aspectRatio);

    // Update Stats
    statStitches.textContent = `${stitchWidth} x ${stitchHeight}`;
    
    const meshCount = parseInt(meshTypeInput.value);
    const physWidth = (stitchWidth / meshCount).toFixed(1);
    const physHeight = (stitchHeight / meshCount).toFixed(1);
    statInches.textContent = `${physWidth}" x ${physHeight}"`;

    renderPattern(stitchWidth, stitchHeight, maxColors);
}

function renderPattern(sw, sh, maxColors) {
    // We use a temporary canvas to downsample the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sw;
    tempCanvas.height = sh;

    // Draw image downsampled
    tempCtx.drawImage(originalImage, 0, 0, sw, sh);
    const imageData = tempCtx.getImageData(0, 0, sw, sh);
    const { palette, imageData: quantizedData } = quantizeImageData(imageData, maxColors);
    tempCtx.putImageData(quantizedData, 0, 0);

    // Scale display canvas
    const scale = Math.max(1, Math.floor(800 / sw)); // Scale factor for viewing
    canvas.width = sw * scale;
    canvas.height = sh * scale;

    // Clear and draw pixelated blocks
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);

    // Draw Grid Overlay
    drawGrid(sw, sh, scale);

    // Extract Palette
    generatePalette(palette);
}

function drawGrid(sw, sh, scale) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;

    // Vertical Lines
    for (let x = 0; x <= sw; x++) {
        // Every 10th line is darker for counting
        ctx.strokeStyle = x % 10 === 0 ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = x % 10 === 0 ? 2 : 1;
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, canvas.height);
        ctx.stroke();
        ctx.beginPath(); // Reset path for different styles
    }

    // Horizontal Lines
    for (let y = 0; y <= sh; y++) {
        ctx.strokeStyle = y % 10 === 0 ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = y % 10 === 0 ? 2 : 1;
        ctx.moveTo(0, y * scale);
        ctx.lineTo(canvas.width, y * scale);
        ctx.stroke();
        ctx.beginPath();
    }
}

function generatePalette(palette) {
    paletteGrid.innerHTML = '';

    palette.forEach(color => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';
        
        const swatch = document.createElement('div');
        swatch.className = 'chip-swatch';
        swatch.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
        
        const hex = document.createElement('span');
        hex.className = 'chip-hex';
        hex.textContent = rgbToHex(color);
        
        chip.appendChild(swatch);
        chip.appendChild(hex);
        paletteGrid.appendChild(chip);
    });

    colorCountLabel.textContent = `${palette.length} yarn colors used`;
}

function quantizeImageData(imageData, maxColors) {
    const histogram = new Map();
    const q = 16;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const qr = Math.round(data[i] / q) * q;
        const qg = Math.round(data[i + 1] / q) * q;
        const qb = Math.round(data[i + 2] / q) * q;
        const key = `${qr},${qg},${qb}`;
        histogram.set(key, (histogram.get(key) || 0) + 1);
    }

    const sorted = Array.from(histogram.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors)
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { r, g, b };
        });

    const quantizedData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const best = getNearestPaletteColor(data[i], data[i + 1], data[i + 2], sorted);
        quantizedData[i] = best.r;
        quantizedData[i + 1] = best.g;
        quantizedData[i + 2] = best.b;
        quantizedData[i + 3] = data[i + 3];
    }

    return {
        palette: sorted,
        imageData: new ImageData(quantizedData, imageData.width, imageData.height)
    };
}

function getNearestPaletteColor(r, g, b, palette) {
    let best = palette[0] || { r, g, b };
    let bestDistance = Number.MAX_VALUE;

    for (const color of palette) {
        const dr = r - color.r;
        const dg = g - color.g;
        const db = b - color.b;
        const distance = dr * dr + dg * dg + db * db;
        if (distance < bestDistance) {
            best = color;
            bestDistance = distance;
        }
    }

    return best;
}

function rgbToHex(rgb) {
    if (typeof rgb === 'string') {
        const parts = rgb.match(/\d+/g);
        return "#" + parts.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    }

    return "#" + [rgb.r, rgb.g, rgb.b].map(value => {
        const hex = value.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

function downloadPattern() {
    if (!originalImage) return;
    const link = document.createElement('a');
    link.download = 'meshup-pattern.png';
    link.href = canvas.toDataURL();
    link.click();
}