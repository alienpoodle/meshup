const imageInput = document.getElementById('image-input');
const patternMenuBtn = document.getElementById('menu-pattern-btn');
const imageMenuBtn = document.getElementById('menu-image-btn');
const patternMenu = document.getElementById('pattern-menu');
const imageEditMenu = document.getElementById('image-edit-menu');
const gridSizeInput = document.getElementById('grid-size');
const colorLimitInput = document.getElementById('color-limit');
const meshTypeInput = document.getElementById('mesh-type');
const widthValLabel = document.getElementById('width-val');
const colorLimitValLabel = document.getElementById('color-limit-val');
const canvasWrapper = document.getElementById('canvas-wrapper');
const canvas = document.getElementById('display-canvas');
const eraserCursor = document.getElementById('eraser-cursor');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const emptyState = document.getElementById('empty-state');
const statStitches = document.getElementById('stat-stitches');
const statInches = document.getElementById('stat-inches');
const paletteGrid = document.getElementById('color-palette');
const colorCountLabel = document.getElementById('color-count');
const downloadBtn = document.getElementById('download-btn');
const removeBgBtn = document.getElementById('remove-bg-btn');
const bgStatus = document.getElementById('bg-status');
const bgThresholdInput = document.getElementById('bg-threshold');
const bgThresholdValLabel = document.getElementById('bg-threshold-val');
const bgColorPicker = document.getElementById('bg-color-picker');
const applyBgColorBtn = document.getElementById('apply-bg-color-btn');
const eraserBtn = document.getElementById('eraser-btn');
const eraserStatus = document.getElementById('eraser-status');
const eraserSizeInput = document.getElementById('eraser-size');
const eraserSizeValLabel = document.getElementById('eraser-size-val');
const rotateLeftBtn = document.getElementById('rotate-left-btn');
const rotateRightBtn = document.getElementById('rotate-right-btn');
const flipHorizontalBtn = document.getElementById('flip-horizontal-btn');
const flipVerticalBtn = document.getElementById('flip-vertical-btn');
const resetImageBtn = document.getElementById('reset-image-btn');

let sourceCanvas = null;
let sourceCtx = null;
let bgRemovalMode = false;
let previewMask = null;
let previewSeed = null;
let pendingHoverPoint = null;
let hoverPreviewQueued = false;
let renderMeta = { sw: 0, sh: 0, scale: 1 };
let eraserMode = false;
let isErasing = false;
let eraserBrushSize = 20;
let originalSnapshotCanvas = null;

// Initialize
imageInput.addEventListener('change', handleImageUpload);
patternMenuBtn.addEventListener('click', () => setSidebarMenu('pattern'));
imageMenuBtn.addEventListener('click', () => setSidebarMenu('image'));
gridSizeInput.addEventListener('input', updateProject);
colorLimitInput.addEventListener('input', updateProject);
meshTypeInput.addEventListener('change', updateProject);
downloadBtn.addEventListener('click', downloadPattern);
removeBgBtn.addEventListener('click', toggleBackgroundRemovalMode);
bgThresholdInput.addEventListener('input', handleThresholdChange);
applyBgColorBtn.addEventListener('click', applyBackgroundColorChange);
eraserBtn.addEventListener('click', toggleEraserMode);
eraserSizeInput.addEventListener('input', handleEraserSizeChange);
rotateLeftBtn.addEventListener('click', () => rotateSourceCanvas(-90));
rotateRightBtn.addEventListener('click', () => rotateSourceCanvas(90));
flipHorizontalBtn.addEventListener('click', () => flipSourceCanvas('horizontal'));
flipVerticalBtn.addEventListener('click', () => flipSourceCanvas('vertical'));
resetImageBtn.addEventListener('click', resetSourceImage);
canvas.addEventListener('mousemove', handleCanvasHover);
canvas.addEventListener('click', confirmBackgroundRemoval);
canvas.addEventListener('mouseleave', clearHoverPreview);
canvas.addEventListener('mousemove', handleEraserPreview);
canvas.addEventListener('mousedown', startErasing);
canvas.addEventListener('mousemove', eraseOnCanvas);
canvas.addEventListener('mouseup', stopErasing);
canvas.addEventListener('mouseleave', stopErasing);
canvas.addEventListener('mouseleave', hideEraserCursor);

bgThresholdValLabel.textContent = bgThresholdInput.value;
eraserSizeValLabel.textContent = eraserSizeInput.value;
setSidebarMenu('pattern');

function setSidebarMenu(menuName) {
    const showPattern = menuName === 'pattern';

    patternMenuBtn.classList.toggle('active', showPattern);
    imageMenuBtn.classList.toggle('active', !showPattern);
    patternMenuBtn.setAttribute('aria-selected', showPattern ? 'true' : 'false');
    imageMenuBtn.setAttribute('aria-selected', showPattern ? 'false' : 'true');

    patternMenu.classList.toggle('active', showPattern);
    imageEditMenu.classList.toggle('active', !showPattern);
    imageEditMenu.setAttribute('aria-hidden', showPattern ? 'true' : 'false');
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const uploadedImage = new Image();
        uploadedImage.onload = () => {
            emptyState.style.display = 'none';
            canvas.style.display = 'block';
            sourceCanvas = document.createElement('canvas');
            sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
            sourceCanvas.width = uploadedImage.width;
            sourceCanvas.height = uploadedImage.height;
            sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            sourceCtx.drawImage(uploadedImage, 0, 0);
            originalSnapshotCanvas = document.createElement('canvas');
            originalSnapshotCanvas.width = uploadedImage.width;
            originalSnapshotCanvas.height = uploadedImage.height;
            originalSnapshotCanvas.getContext('2d').drawImage(uploadedImage, 0, 0);
            clearHoverPreview();
            setBackgroundMode(false);
            updateProject();
        };
        uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateProject() {
    if (!sourceCanvas) return;

    const stitchWidth = parseInt(gridSizeInput.value);
    widthValLabel.textContent = stitchWidth;

    const maxColors = parseInt(colorLimitInput.value);
    colorLimitValLabel.textContent = maxColors;

    const aspectRatio = sourceCanvas.height / sourceCanvas.width;
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
    tempCtx.drawImage(sourceCanvas, 0, 0, sw, sh);
    const imageData = tempCtx.getImageData(0, 0, sw, sh);
    const { palette, imageData: quantizedData } = quantizeImageData(imageData, maxColors);
    tempCtx.putImageData(quantizedData, 0, 0);

    // Scale display canvas
    const scale = Math.max(1, Math.floor(800 / sw)); // Scale factor for viewing
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    renderMeta = { sw, sh, scale };

    // Clear and draw pixelated blocks
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);

    // Draw Grid Overlay
    drawGrid(sw, sh, scale);

    // Show hover preview while background-select mode is active.
    if (bgRemovalMode && previewMask) {
        drawRemovalPreviewOverlay(sw, sh, scale);
    }

    // Extract Palette
    generatePalette(palette);
}

function handleThresholdChange() {
    bgThresholdValLabel.textContent = bgThresholdInput.value;
    if (!bgRemovalMode) return;
    if (!previewSeed) return;

    previewMask = computeFloodMask(previewSeed.x, previewSeed.y, getThresholdValue());
    updateProject();
}

function toggleBackgroundRemovalMode() {
    if (!sourceCanvas) return;
    setSidebarMenu('image');
    setBackgroundMode(!bgRemovalMode);
}

function setBackgroundMode(enabled) {
    bgRemovalMode = enabled;
    removeBgBtn.classList.toggle('active', enabled);
    canvas.style.cursor = enabled ? 'crosshair' : (eraserMode ? 'crosshair' : 'default');

    if (enabled) {
        bgStatus.textContent = 'Hover to preview what will be removed, then click to confirm.';
        eraserMode = false;
        eraserBtn.classList.remove('active');
    } else {
        bgStatus.textContent = 'Enable selection mode, hover to preview, then click to confirm.';
        clearHoverPreview();
    }

    if (enabled) {
        hideEraserCursor();
    }
}

function getThresholdValue() {
    return parseInt(bgThresholdInput.value, 10);
}

function handleCanvasHover(event) {
    if (!bgRemovalMode || !sourceCanvas) return;

    pendingHoverPoint = mapCanvasToSourcePoint(event);
    if (!pendingHoverPoint) return;

    if (hoverPreviewQueued) return;
    hoverPreviewQueued = true;

    requestAnimationFrame(() => {
        hoverPreviewQueued = false;
        if (!pendingHoverPoint) return;

        const point = pendingHoverPoint;
        pendingHoverPoint = null;

        if (previewSeed) {
            const dx = point.x - previewSeed.x;
            const dy = point.y - previewSeed.y;
            if (dx * dx + dy * dy < 36) {
                return;
            }
        }

        previewSeed = point;
        previewMask = computeFloodMask(point.x, point.y, getThresholdValue());
        updateProject();
    });
}

function confirmBackgroundRemoval(event) {
    if (!bgRemovalMode || !sourceCanvas || !sourceCtx) return;

    const clickedPoint = mapCanvasToSourcePoint(event);
    if (!clickedPoint) return;

    if (!previewMask || !previewSeed || previewSeed.x !== clickedPoint.x || previewSeed.y !== clickedPoint.y) {
        previewSeed = clickedPoint;
        previewMask = computeFloodMask(clickedPoint.x, clickedPoint.y, getThresholdValue());
    }

    applyMaskToSource(previewMask);
    setBackgroundMode(false);
    bgStatus.textContent = 'Background removed from selected region.';
    updateProject();
}

function clearHoverPreview() {
    previewMask = null;
    previewSeed = null;
    pendingHoverPoint = null;
    if (sourceCanvas) {
        updateProject();
    }
}

function mapCanvasToSourcePoint(event) {
    if (!sourceCanvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const normX = (event.clientX - rect.left) / rect.width;
    const normY = (event.clientY - rect.top) / rect.height;
    const x = Math.max(0, Math.min(sourceCanvas.width - 1, Math.floor(normX * sourceCanvas.width)));
    const y = Math.max(0, Math.min(sourceCanvas.height - 1, Math.floor(normY * sourceCanvas.height)));
    return { x, y };
}

function computeFloodMask(startX, startY, threshold) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imageData = sourceCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const total = width * height;

    const startIndex = (startY * width + startX) * 4;
    const targetA = data[startIndex + 3];
    if (targetA === 0) {
        return new Uint8Array(total);
    }

    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];

    const queueX = new Int32Array(total);
    const queueY = new Int32Array(total);
    const mask = new Uint8Array(total);
    let head = 0;
    let tail = 0;

    queueX[tail] = startX;
    queueY[tail] = startY;
    tail += 1;

    while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head += 1;

        const pixelPos = y * width + x;
        if (mask[pixelPos]) continue;

        const dataPos = pixelPos * 4;
        const alpha = data[dataPos + 3];
        if (alpha === 0) continue;

        const dr = data[dataPos] - targetR;
        const dg = data[dataPos + 1] - targetG;
        const db = data[dataPos + 2] - targetB;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);
        if (distance > threshold) continue;

        mask[pixelPos] = 1;

        if (x > 0) {
            queueX[tail] = x - 1;
            queueY[tail] = y;
            tail += 1;
        }
        if (x < width - 1) {
            queueX[tail] = x + 1;
            queueY[tail] = y;
            tail += 1;
        }
        if (y > 0) {
            queueX[tail] = x;
            queueY[tail] = y - 1;
            tail += 1;
        }
        if (y < height - 1) {
            queueX[tail] = x;
            queueY[tail] = y + 1;
            tail += 1;
        }
    }

    return softenMaskEdges(mask, width, height);
}

function softenMaskEdges(mask, width, height) {
    const softened = mask.slice();

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            if (!mask[idx]) continue;

            const neighbors =
                mask[idx - 1] +
                mask[idx + 1] +
                mask[idx - width] +
                mask[idx + width];

            if (neighbors <= 1) {
                softened[idx] = 0;
            }
        }
    }

    return softened;
}

function applyMaskToSource(mask) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imageData = sourceCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;
        data[i * 4 + 3] = 0;
    }

    sourceCtx.putImageData(imageData, 0, 0);
}

function rotateSourceCanvas(degrees) {
    if (!sourceCanvas) return;

    const src = sourceCanvas;
    const rotated = document.createElement('canvas');
    const rotatedCtx = rotated.getContext('2d', { willReadFrequently: true });
    const clockwise = degrees > 0;

    rotated.width = src.height;
    rotated.height = src.width;

    rotatedCtx.save();
    if (clockwise) {
        rotatedCtx.translate(rotated.width, 0);
        rotatedCtx.rotate(Math.PI / 2);
    } else {
        rotatedCtx.translate(0, rotated.height);
        rotatedCtx.rotate(-Math.PI / 2);
    }
    rotatedCtx.drawImage(src, 0, 0);
    rotatedCtx.restore();

    sourceCanvas = rotated;
    sourceCtx = rotatedCtx;
    disableEditModes();
    updateProject();
}

function flipSourceCanvas(axis) {
    if (!sourceCanvas) return;

    const src = sourceCanvas;
    const flipped = document.createElement('canvas');
    const flippedCtx = flipped.getContext('2d', { willReadFrequently: true });
    flipped.width = src.width;
    flipped.height = src.height;

    flippedCtx.save();
    if (axis === 'horizontal') {
        flippedCtx.translate(flipped.width, 0);
        flippedCtx.scale(-1, 1);
    } else {
        flippedCtx.translate(0, flipped.height);
        flippedCtx.scale(1, -1);
    }
    flippedCtx.drawImage(src, 0, 0);
    flippedCtx.restore();

    sourceCanvas = flipped;
    sourceCtx = flippedCtx;
    disableEditModes();
    updateProject();
}

function resetSourceImage() {
    if (!sourceCanvas || !originalSnapshotCanvas) return;

    sourceCanvas.width = originalSnapshotCanvas.width;
    sourceCanvas.height = originalSnapshotCanvas.height;
    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceCtx.drawImage(originalSnapshotCanvas, 0, 0);
    disableEditModes();
    updateProject();
}

function disableEditModes() {
    setBackgroundMode(false);
    eraserMode = false;
    eraserBtn.classList.remove('active');
    hideEraserCursor();
    canvas.style.cursor = 'default';
}

function drawRemovalPreviewOverlay(sw, sh, scale) {
    if (!previewMask || !sourceCanvas) return;

    ctx.fillStyle = 'rgba(255, 83, 112, 0.35)';

    for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
            const srcX = Math.min(sourceCanvas.width - 1, Math.floor(((x + 0.5) / sw) * sourceCanvas.width));
            const srcY = Math.min(sourceCanvas.height - 1, Math.floor(((y + 0.5) / sh) * sourceCanvas.height));
            if (!previewMask[srcY * sourceCanvas.width + srcX]) continue;

            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    if (previewSeed) {
        const markerX = Math.floor((previewSeed.x / sourceCanvas.width) * sw) * scale;
        const markerY = Math.floor((previewSeed.y / sourceCanvas.height) * sh) * scale;
        ctx.strokeStyle = 'rgba(255, 214, 10, 0.95)';
        ctx.lineWidth = 2;
        ctx.strokeRect(markerX + 1, markerY + 1, Math.max(4, scale - 2), Math.max(4, scale - 2));
    }

    drawGrid(sw, sh, scale);
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
        if (data[i + 3] === 0) continue;
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
        if (data[i + 3] === 0) {
            quantizedData[i] = 0;
            quantizedData[i + 1] = 0;
            quantizedData[i + 2] = 0;
            quantizedData[i + 3] = 0;
            continue;
        }

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
    if (!sourceCanvas) return;
    const link = document.createElement('a');
    link.download = 'meshup-pattern.png';
    link.href = canvas.toDataURL();
    link.click();
}

// ========== Background Color Change ==========
function applyBackgroundColorChange() {
    if (!sourceCanvas) return;
    
    const newColorHex = bgColorPicker.value;
    const newRGB = hexToRgb(newColorHex);
    
    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;
    
    // Find the most common color (likely the background)
    const colorFreq = new Map();
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a === 0) continue;
        
        const key = `${r},${g},${b}`;
        colorFreq.set(key, (colorFreq.get(key) || 0) + 1);
    }
    
    if (colorFreq.size === 0) return;
    
    // Get the most common color
    const mostCommonColor = Array.from(colorFreq.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
    const [oldR, oldG, oldB] = mostCommonColor.split(',').map(Number);
    
    // Replace old background with new color (with threshold for similar colors)
    const colorThreshold = 30;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const dr = r - oldR;
        const dg = g - oldG;
        const db = b - oldB;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);
        
        if (distance < colorThreshold) {
            data[i] = newRGB.r;
            data[i + 1] = newRGB.g;
            data[i + 2] = newRGB.b;
        }
    }
    
    sourceCtx.putImageData(imageData, 0, 0);
    updateProject();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

// ========== Eraser Tool ==========
function toggleEraserMode() {
    if (!sourceCanvas) return;
    setSidebarMenu('image');
    eraserMode = !eraserMode;
    eraserBtn.classList.toggle('active', eraserMode);
    canvas.style.cursor = eraserMode ? 'crosshair' : 'default';
    
    if (eraserMode) {
        eraserStatus.textContent = 'Click and drag to erase areas from the image.';
        bgRemovalMode = false;
        removeBgBtn.classList.remove('active');
        clearHoverPreview();
    } else {
        eraserStatus.textContent = 'Click and drag to erase areas from the image.';
        hideEraserCursor();
    }
}

function handleEraserSizeChange() {
    eraserBrushSize = parseInt(eraserSizeInput.value, 10);
    eraserSizeValLabel.textContent = eraserBrushSize;
    updateEraserCursorSize();
}

function handleEraserPreview(event) {
    if (!eraserMode || !sourceCanvas) return;

    updateEraserCursor(event);
}

function startErasing(event) {
    if (!eraserMode || !sourceCanvas) return;
    isErasing = true;
    eraseOnCanvas(event);
}

function stopErasing() {
    isErasing = false;
}

function eraseOnCanvas(event) {
    if (!eraserMode || !sourceCanvas || !sourceCtx || !isErasing) return;

    updateEraserCursor(event);
    
    const sourcePoint = mapCanvasToSourcePoint(event);
    if (!sourcePoint) return;
    
    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;
    const width = sourceCanvas.width;
    
    const x = sourcePoint.x;
    const y = sourcePoint.y;
    const radius = eraserBrushSize / 2;
    
    // Paint eraser brush - make pixels transparent in a circular brush
    for (let py = Math.max(0, y - eraserBrushSize); py < Math.min(sourceCanvas.height, y + eraserBrushSize); py++) {
        for (let px = Math.max(0, x - eraserBrushSize); px < Math.min(sourceCanvas.width, x + eraserBrushSize); px++) {
            const dx = px - x;
            const dy = py - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius) {
                const idx = (py * width + px) * 4;
                // Soft edge with falloff
                const alpha = Math.max(0, 255 * (1 - (dist / radius)));
                data[idx + 3] = Math.max(0, data[idx + 3] - alpha);
            }
        }
    }
    
    sourceCtx.putImageData(imageData, 0, 0);
    updateProject();
}

function updateEraserCursorSize() {
    if (!sourceCanvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / sourceCanvas.width;
    const diameter = Math.max(8, eraserBrushSize * scaleX);

    eraserCursor.style.width = `${diameter}px`;
    eraserCursor.style.height = `${diameter}px`;
}

function updateEraserCursor(event) {
    if (!eraserMode || !sourceCanvas) return;

    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - wrapperRect.top;
    const insideCanvas =
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right &&
        event.clientY >= canvasRect.top &&
        event.clientY <= canvasRect.bottom;

    if (!insideCanvas) {
        hideEraserCursor();
        return;
    }

    updateEraserCursorSize();
    eraserCursor.style.left = `${x}px`;
    eraserCursor.style.top = `${y}px`;
    eraserCursor.style.display = 'block';
}

function hideEraserCursor() {
    eraserCursor.style.display = 'none';
}