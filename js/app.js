const imageInput = document.getElementById('image-input');
const gridSizeInput = document.getElementById('grid-size');
const meshTypeInput = document.getElementById('mesh-type');
const widthValLabel = document.getElementById('width-val');
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

    const aspectRatio = originalImage.height / originalImage.width;
    const stitchHeight = Math.round(stitchWidth * aspectRatio);

    // Update Stats
    statStitches.textContent = `${stitchWidth} x ${stitchHeight}`;
    
    const meshCount = parseInt(meshTypeInput.value);
    const physWidth = (stitchWidth / meshCount).toFixed(1);
    const physHeight = (stitchHeight / meshCount).toFixed(1);
    statInches.textContent = `${physWidth}" x ${physHeight}"`;

    renderPattern(stitchWidth, stitchHeight);
}

function renderPattern(sw, sh) {
    // We use a temporary canvas to downsample the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sw;
    tempCanvas.height = sh;

    // Draw image downsampled
    tempCtx.drawImage(originalImage, 0, 0, sw, sh);
    const imageData = tempCtx.getImageData(0, 0, sw, sh);

    // Scale display canvas
    const scale = Math.floor(800 / sw); // Scale factor for viewing
    canvas.width = sw * scale;
    canvas.height = sh * scale;

    // Clear and draw pixelated blocks
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);

    // Draw Grid Overlay
    drawGrid(sw, sh, scale);

    // Extract Palette
    generatePalette(imageData.data);
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

function generatePalette(data) {
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Quantize colors slightly to avoid too many variations
        const q = 16;
        const qr = Math.round(r / q) * q;
        const qg = Math.round(g / q) * q;
        const qb = Math.round(b / q) * q;
        colors.add(`rgb(${qr},${qg},${qb})`);
    }

    paletteGrid.innerHTML = '';
    const colorArray = Array.from(colors).slice(0, 24); // Limit to top 24 for demo
    
    colorArray.forEach(color => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';
        
        const swatch = document.createElement('div');
        swatch.className = 'chip-swatch';
        swatch.style.backgroundColor = color;
        
        const hex = document.createElement('span');
        hex.className = 'chip-hex';
        hex.textContent = rgbToHex(color);
        
        chip.appendChild(swatch);
        chip.appendChild(hex);
        paletteGrid.appendChild(chip);
    });

    colorCountLabel.textContent = `${colorArray.length} unique yarn colors`;
}

function rgbToHex(rgb) {
    const parts = rgb.match(/\d+/g);
    return "#" + parts.map(x => {
        const hex = parseInt(x).toString(16);
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