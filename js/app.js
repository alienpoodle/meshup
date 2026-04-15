const imageInput = document.getElementById('image-input');
const patternMenuBtn = document.getElementById('menu-pattern-btn');
const imageMenuBtn = document.getElementById('menu-image-btn');
const patternMenu = document.getElementById('pattern-menu');
const imageEditMenu = document.getElementById('image-edit-menu');
const gridSizeInput = document.getElementById('grid-size');
const colorLimitInput = document.getElementById('color-limit');
const sharpnessInput = document.getElementById('sharpness');
const meshTypeInput = document.getElementById('mesh-type');
const widthValLabel = document.getElementById('width-val');
const colorLimitValLabel = document.getElementById('color-limit-val');
const sharpnessValLabel = document.getElementById('sharpness-val');
const gridToggleLabel = document.getElementById('grid-toggle-label');
const gridContrastInput = document.getElementById('grid-contrast');
const gridContrastValLabel = document.getElementById('grid-contrast-val');
const printableModeLabel = document.getElementById('printable-mode-label');
const toggleGridBtn = document.getElementById('toggle-grid-btn');
const togglePrintableBtn = document.getElementById('toggle-printable-btn');
const canvasWrapper = document.getElementById('canvas-wrapper');
const canvas = document.getElementById('display-canvas');
const eraserCursor = document.getElementById('eraser-cursor');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const emptyState = document.getElementById('empty-state');
const statStitches = document.getElementById('stat-stitches');
const statInches = document.getElementById('stat-inches');
const sheetFitStatus = document.getElementById('sheet-fit-status');
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
let originalSnapshotCanvas = null;

let bgRemovalMode = false;
let previewMask = null;
let previewSeed = null;
let pendingHoverPoint = null;
let hoverPreviewQueued = false;

let eraserMode = false;
let isErasing = false;
let eraserBrushSize = 20;

let showGrid = true;
let printableMode = false;
let gridContrast = 60;
let previewZoom = 1;

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3];

let lastPattern = null;

const GRID_MINOR_BASE = 0.12;
const GRID_MAJOR_BASE = 0.34;
const GRID_SYMBOLS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32'
];

// Curated DMC subset for practical nearest-thread mapping.
const DMC_THREADS = [
    { code: 'B5200', name: 'Snow White', r: 255, g: 255, b: 255 },
    { code: '310', name: 'Black', r: 0, g: 0, b: 0 },
    { code: '318', name: 'Steel Gray Lt', r: 171, g: 171, b: 171 },
    { code: '414', name: 'Steel Gray Dk', r: 98, g: 93, b: 87 },
    { code: '415', name: 'Pearl Gray', r: 211, g: 211, b: 214 },
    { code: '436', name: 'Tan', r: 203, g: 144, b: 81 },
    { code: '437', name: 'Tan Lt', r: 228, g: 187, b: 142 },
    { code: '445', name: 'Lemon Lt', r: 255, g: 251, b: 139 },
    { code: '470', name: 'Avocado Lt', r: 148, g: 171, b: 79 },
    { code: '471', name: 'Avocado Grn Very Lt', r: 174, g: 191, b: 121 },
    { code: '498', name: 'Red Dk', r: 167, g: 19, b: 43 },
    { code: '550', name: 'Violet Very Dk', r: 92, g: 24, b: 78 },
    { code: '552', name: 'Violet Med', r: 154, g: 91, b: 154 },
    { code: '597', name: 'Turquoise', r: 91, g: 163, b: 179 },
    { code: '598', name: 'Turquoise Lt', r: 144, g: 195, b: 204 },
    { code: '606', name: 'Orange-Red Br', r: 250, g: 50, b: 3 },
    { code: '666', name: 'Red Br', r: 227, g: 29, b: 66 },
    { code: '699', name: 'Green', r: 5, g: 101, b: 23 },
    { code: '700', name: 'Green Br', r: 7, g: 115, b: 27 },
    { code: '703', name: 'Chartreuse', r: 123, g: 181, b: 71 },
    { code: '720', name: 'Orange Spice Dk', r: 229, g: 92, b: 31 },
    { code: '741', name: 'Tangerine Med', r: 255, g: 163, b: 43 },
    { code: '742', name: 'Tangerine Lt', r: 255, g: 191, b: 87 },
    { code: '762', name: 'Pearl Gray Very Lt', r: 236, g: 236, b: 236 },
    { code: '775', name: 'Baby Blue Very Lt', r: 183, g: 225, b: 227 },
    { code: '796', name: 'Royal Blue Dk', r: 17, g: 65, b: 109 },
    { code: '797', name: 'Royal Blue', r: 19, g: 71, b: 125 },
    { code: '798', name: 'Delft Blue Dk', r: 70, g: 106, b: 142 },
    { code: '820', name: 'Royal Blue Very Dk', r: 14, g: 54, b: 92 },
    { code: '838', name: 'Beige Brown Very Dk', r: 89, g: 73, b: 55 },
    { code: '840', name: 'Beige Brown Med', r: 154, g: 124, b: 92 },
    { code: '898', name: 'Coffee Brown Very Dk', r: 73, g: 42, b: 19 },
    { code: '905', name: 'Parrot Green Dk', r: 98, g: 148, b: 41 },
    { code: '906', name: 'Parrot Green Med', r: 127, g: 179, b: 53 },
    { code: '917', name: 'Plum Med', r: 171, g: 68, b: 113 },
    { code: '919', name: 'Red-Copper', r: 166, g: 69, b: 16 },
    { code: '938', name: 'Coffee Brown Ult Dk', r: 54, g: 31, b: 14 },
    { code: '945', name: 'Tawny', r: 251, g: 213, b: 187 },
    { code: '947', name: 'Burnt Orange', r: 255, g: 123, b: 77 },
    { code: '995', name: 'Electric Blue Dk', r: 38, g: 150, b: 182 },
    { code: '3011', name: 'Khaki Green Dk', r: 124, g: 146, b: 113 },
    { code: '3012', name: 'Khaki Green Med', r: 166, g: 189, b: 155 },
    { code: '3325', name: 'Baby Blue Lt', r: 184, g: 210, b: 230 },
    { code: '3341', name: 'Apricot', r: 252, g: 171, b: 152 },
    { code: '3345', name: 'Hunter Green Dk', r: 27, g: 89, b: 21 },
    { code: '3347', name: 'Yellow Green Med', r: 113, g: 147, b: 92 },
    { code: '3371', name: 'Black Brown', r: 30, g: 17, b: 8 },
    { code: '3607', name: 'Plum Lt', r: 197, g: 73, b: 137 },
    { code: '3608', name: 'Plum Very Lt', r: 234, g: 156, b: 196 },
    { code: '3689', name: 'Mauve Lt', r: 251, g: 191, b: 194 },
    { code: '3706', name: 'Melon Med', r: 255, g: 173, b: 156 },
    { code: '3712', name: 'Salmon Med', r: 241, g: 135, b: 135 },
    { code: '3760', name: 'Wedgewood Med', r: 62, g: 133, b: 162 },
    { code: '3799', name: 'Pewter Gray Very Dk', r: 66, g: 66, b: 66 },
    { code: '3811', name: 'Turquoise Very Lt', r: 188, g: 227, b: 230 },
    { code: '3844', name: 'Bright Turquoise Dk', r: 18, g: 174, b: 186 },
    { code: '3865', name: 'Winter White', r: 249, g: 247, b: 241 }
];

// Initialize
imageInput.addEventListener('change', handleImageUpload);
patternMenuBtn.addEventListener('click', () => setSidebarMenu('pattern'));
imageMenuBtn.addEventListener('click', () => setSidebarMenu('image'));
gridSizeInput.addEventListener('input', updateProject);
colorLimitInput.addEventListener('input', updateProject);
sharpnessInput.addEventListener('input', updateProject);
meshTypeInput.addEventListener('change', updateProject);
downloadBtn.addEventListener('click', exportPrintablePatternSheet);
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
toggleGridBtn.addEventListener('click', () => {
    showGrid = !showGrid;
    syncPatternSettingsUI();
    updateProject();
});
togglePrintableBtn.addEventListener('click', () => {
    printableMode = !printableMode;
    syncPatternSettingsUI();
    updateProject();
});

document.getElementById('zoom-in-btn').addEventListener('click', () => {
    const idx = ZOOM_LEVELS.indexOf(previewZoom);
    if (idx < ZOOM_LEVELS.length - 1) {
        previewZoom = ZOOM_LEVELS[idx + 1];
        updateProject();
    }
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
    const idx = ZOOM_LEVELS.indexOf(previewZoom);
    if (idx > 0) {
        previewZoom = ZOOM_LEVELS[idx - 1];
        updateProject();
    }
});

document.getElementById('zoom-reset-btn').addEventListener('click', () => {
    previewZoom = 1;
    updateProject();
});

canvasWrapper.addEventListener('wheel', (e) => {
    if (!sourceCanvas) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const idx = ZOOM_LEVELS.indexOf(previewZoom);
    const next = idx + dir;
    if (next >= 0 && next < ZOOM_LEVELS.length) {
        previewZoom = ZOOM_LEVELS[next];
        updateProject();
    }
}, { passive: false });
gridContrastInput.addEventListener('input', () => {
    gridContrast = parseInt(gridContrastInput.value, 10);
    syncPatternSettingsUI();
    updateProject();
});
canvas.addEventListener('mousemove', handleCanvasHover);
canvas.addEventListener('click', confirmBackgroundRemoval);
canvas.addEventListener('mouseleave', clearHoverPreview);
canvas.addEventListener('mousemove', handleEraserPreview);
canvas.addEventListener('mousedown', startErasing);
canvas.addEventListener('mousemove', eraseOnCanvas);
canvas.addEventListener('mouseup', stopErasing);
canvas.addEventListener('mouseleave', stopErasing);
canvas.addEventListener('mouseleave', hideEraserCursor);

setSidebarMenu('pattern');
syncPatternSettingsUI();
bgThresholdValLabel.textContent = bgThresholdInput.value;
eraserSizeValLabel.textContent = eraserSizeInput.value;

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

function syncPatternSettingsUI() {
    widthValLabel.textContent = gridSizeInput.value;
    colorLimitValLabel.textContent = colorLimitInput.value;
    sharpnessValLabel.textContent = sharpnessInput.value;
    gridContrastValLabel.textContent = gridContrastInput.value;
    gridToggleLabel.textContent = showGrid ? 'On' : 'Off';
    printableModeLabel.textContent = printableMode ? 'On' : 'Off';
    toggleGridBtn.classList.toggle('soft-active', showGrid);
    togglePrintableBtn.classList.toggle('soft-active', printableMode);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isPng = file.type === 'image/png';
    if (!isPng) {
        bgStatus.textContent = 'Tip: PNG files produce the cleanest stitch edges and avoid compression artifacts.';
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const uploadedImage = new Image();
        uploadedImage.decoding = 'sync';
        uploadedImage.onload = () => {
            emptyState.style.display = 'none';
            canvas.style.display = 'block';

            sourceCanvas = document.createElement('canvas');
            sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
            sourceCanvas.width = uploadedImage.width;
            sourceCanvas.height = uploadedImage.height;
            sourceCtx.imageSmoothingEnabled = false;
            sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            sourceCtx.drawImage(uploadedImage, 0, 0);

            originalSnapshotCanvas = document.createElement('canvas');
            originalSnapshotCanvas.width = uploadedImage.width;
            originalSnapshotCanvas.height = uploadedImage.height;
            originalSnapshotCanvas.getContext('2d').drawImage(uploadedImage, 0, 0);

            disableEditModes();
            updateProject();
        };
        uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateProject() {
    syncPatternSettingsUI();
    if (!sourceCanvas) return;

    const stitchWidth = parseInt(gridSizeInput.value, 10);
    const maxColors = parseInt(colorLimitInput.value, 10);
    const sharpness = parseInt(sharpnessInput.value, 10);

    const aspectRatio = sourceCanvas.height / sourceCanvas.width;
    const stitchHeight = Math.max(1, Math.round(stitchWidth * aspectRatio));

    statStitches.textContent = `${stitchWidth} x ${stitchHeight}`;

    const meshCount = parseInt(meshTypeInput.value, 10);
    const physWidth = stitchWidth / meshCount;
    const physHeight = stitchHeight / meshCount;
    statInches.textContent = `${physWidth.toFixed(1)}" x ${physHeight.toFixed(1)}"`;

    updateSheetFitStatus(meshCount, physWidth, physHeight);
    renderPattern(stitchWidth, stitchHeight, maxColors, sharpness, meshCount, physWidth, physHeight);
}

function updateSheetFitStatus(meshCount, physWidth, physHeight) {
    const sheetW = 10.5;
    const sheetH = 13.5;

    if (meshCount !== 7) {
        sheetFitStatus.textContent = 'Check applies to 7-count only';
        sheetFitStatus.classList.remove('stat-warning');
        return;
    }

    const fitsNormal = physWidth <= sheetW && physHeight <= sheetH;
    const fitsRotated = physWidth <= sheetH && physHeight <= sheetW;
    const fits = fitsNormal || fitsRotated;

    if (fits) {
        sheetFitStatus.textContent = 'Within 10.5" x 13.5"';
        sheetFitStatus.classList.remove('stat-warning');
    } else {
        sheetFitStatus.textContent = 'Exceeds 10.5" x 13.5" sheet';
        sheetFitStatus.classList.add('stat-warning');
    }
}

function renderPattern(sw, sh, maxColors, sharpness, meshCount, physWidth, physHeight) {
    const sampledImage = downsampleWithSharpness(sourceCanvas, sw, sh, sharpness / 100);
    const quantized = quantizeKMeans(sampledImage, maxColors);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.putImageData(quantized.imageData, 0, 0);

    const baseScale = Math.max(1, Math.floor(800 / sw));
    const scale = Math.max(1, Math.round(baseScale * previewZoom));
    canvas.width = sw * scale;
    canvas.height = sh * scale;

    const zoomControls = document.getElementById('zoom-controls');
    zoomControls.classList.toggle('visible', true);
    document.getElementById('zoom-label').textContent = `${Math.round(previewZoom * 100)}%`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);

    if (printableMode) {
        drawSymbolOverlay(quantized.indexMap, quantized.palette, sw, sh, scale);
    }

    if (showGrid) {
        drawGrid(sw, sh, scale, gridContrast);
    }

    if (bgRemovalMode && previewMask) {
        drawRemovalPreviewOverlay(sw, sh, scale);
    }

    const stitchCounts = countStitchesByPalette(quantized.indexMap, quantized.palette.length);
    const threadMap = mapPaletteToThreads(quantized.palette);

    generatePalette(quantized.palette, threadMap, stitchCounts);

    lastPattern = {
        sw,
        sh,
        meshCount,
        physWidth,
        physHeight,
        palette: quantized.palette,
        threadMap,
        stitchCounts,
        indexMap: quantized.indexMap,
        stitchWidth: sw,
        stitchHeight: sh
    };
}

function downsampleWithSharpness(srcCanvas, outW, outH, sharpnessAmount) {
    const srcW = srcCanvas.width;
    const srcH = srcCanvas.height;
    const srcData = sourceCtx.getImageData(0, 0, srcW, srcH).data;
    const outData = new Uint8ClampedArray(outW * outH * 4);

    for (let y = 0; y < outH; y += 1) {
        const y0 = Math.floor((y * srcH) / outH);
        const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * srcH) / outH));
        const centerY = Math.min(srcH - 1, Math.floor(((y + 0.5) * srcH) / outH));

        for (let x = 0; x < outW; x += 1) {
            const x0 = Math.floor((x * srcW) / outW);
            const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * srcW) / outW));
            const centerX = Math.min(srcW - 1, Math.floor(((x + 0.5) * srcW) / outW));

            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumA = 0;
            let count = 0;

            for (let sy = y0; sy < y1; sy += 1) {
                for (let sx = x0; sx < x1; sx += 1) {
                    const i = (sy * srcW + sx) * 4;
                    sumR += srcData[i];
                    sumG += srcData[i + 1];
                    sumB += srcData[i + 2];
                    sumA += srcData[i + 3];
                    count += 1;
                }
            }

            const avgR = sumR / count;
            const avgG = sumG / count;
            const avgB = sumB / count;
            const avgA = sumA / count;

            const ci = (centerY * srcW + centerX) * 4;
            const centerR = srcData[ci];
            const centerG = srcData[ci + 1];
            const centerB = srcData[ci + 2];
            const centerA = srcData[ci + 3];

            const blend = sharpnessAmount;
            const r = Math.round(avgR * (1 - blend) + centerR * blend);
            const g = Math.round(avgG * (1 - blend) + centerG * blend);
            const b = Math.round(avgB * (1 - blend) + centerB * blend);
            const a = Math.round(avgA * (1 - blend) + centerA * blend);

            const oi = (y * outW + x) * 4;
            outData[oi] = r;
            outData[oi + 1] = g;
            outData[oi + 2] = b;
            outData[oi + 3] = a;
        }
    }

    return new ImageData(outData, outW, outH);
}

function quantizeKMeans(imageData, maxColors) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const total = width * height;

    const opaqueIdx = [];
    for (let i = 0; i < total; i += 1) {
        if (pixels[i * 4 + 3] > 0) opaqueIdx.push(i);
    }

    if (opaqueIdx.length === 0) {
        return {
            palette: [],
            indexMap: new Int16Array(total).fill(-1),
            imageData: new ImageData(new Uint8ClampedArray(pixels), width, height)
        };
    }

    const k = Math.max(2, Math.min(maxColors, 20, opaqueIdx.length));
    const centroids = initializeCentroids(pixels, opaqueIdx, k);
    const assignments = new Int16Array(total).fill(-1);

    for (let iter = 0; iter < 8; iter += 1) {
        const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, n: 0 }));

        for (let i = 0; i < opaqueIdx.length; i += 1) {
            const pxIdx = opaqueIdx[i];
            const p = pxIdx * 4;
            const r = pixels[p];
            const g = pixels[p + 1];
            const b = pixels[p + 2];

            let best = 0;
            let bestDist = Number.MAX_VALUE;

            for (let c = 0; c < k; c += 1) {
                const dr = r - centroids[c].r;
                const dg = g - centroids[c].g;
                const db = b - centroids[c].b;
                const d = dr * dr + dg * dg + db * db;
                if (d < bestDist) {
                    bestDist = d;
                    best = c;
                }
            }

            assignments[pxIdx] = best;
            sums[best].r += r;
            sums[best].g += g;
            sums[best].b += b;
            sums[best].n += 1;
        }

        for (let c = 0; c < k; c += 1) {
            if (sums[c].n === 0) continue;
            centroids[c].r = Math.round(sums[c].r / sums[c].n);
            centroids[c].g = Math.round(sums[c].g / sums[c].n);
            centroids[c].b = Math.round(sums[c].b / sums[c].n);
        }
    }

    const counts = Array.from({ length: k }, () => 0);
    for (let i = 0; i < opaqueIdx.length; i += 1) {
        const assigned = assignments[opaqueIdx[i]];
        if (assigned >= 0) counts[assigned] += 1;
    }

    const remap = new Int16Array(k).fill(-1);
    const compactPalette = [];
    for (let i = 0; i < k; i += 1) {
        if (counts[i] > 0) {
            remap[i] = compactPalette.length;
            compactPalette.push({ r: centroids[i].r, g: centroids[i].g, b: centroids[i].b });
        }
    }

    const out = new Uint8ClampedArray(pixels.length);
    const compactAssignments = new Int16Array(total).fill(-1);
    for (let i = 0; i < total; i += 1) {
        const srcPos = i * 4;
        if (pixels[srcPos + 3] === 0 || assignments[i] < 0) {
            out[srcPos] = 0;
            out[srcPos + 1] = 0;
            out[srcPos + 2] = 0;
            out[srcPos + 3] = 0;
            continue;
        }

        const mappedIdx = remap[assignments[i]];
        if (mappedIdx < 0) {
            out[srcPos] = 0;
            out[srcPos + 1] = 0;
            out[srcPos + 2] = 0;
            out[srcPos + 3] = 0;
            continue;
        }

        compactAssignments[i] = mappedIdx;
        const c = compactPalette[mappedIdx];
        out[srcPos] = c.r;
        out[srcPos + 1] = c.g;
        out[srcPos + 2] = c.b;
        out[srcPos + 3] = 255;
    }

    return {
        palette: compactPalette,
        indexMap: compactAssignments,
        imageData: new ImageData(out, width, height)
    };
}

function initializeCentroids(pixels, opaqueIdx, k) {
    const centroids = [];
    const step = Math.max(1, Math.floor(opaqueIdx.length / k));

    for (let i = 0; i < k; i += 1) {
        const pxIdx = opaqueIdx[Math.min(opaqueIdx.length - 1, i * step)];
        const p = pxIdx * 4;
        centroids.push({ r: pixels[p], g: pixels[p + 1], b: pixels[p + 2] });
    }

    return centroids;
}

function drawSymbolOverlay(indexMap, palette, sw, sh, scale) {
    if (!indexMap || !palette.length) return;

    const fontSize = Math.max(8, Math.floor(scale * 0.65));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
            const idx = y * sw + x;
            const paletteIdx = indexMap[idx];
            if (paletteIdx < 0) continue;

            const color = palette[paletteIdx];
            const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
            ctx.fillStyle = luminance > 0.5 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.9)';

            const symbol = GRID_SYMBOLS[paletteIdx] || String(paletteIdx + 1);
            ctx.fillText(symbol, x * scale + scale / 2, y * scale + scale / 2);
        }
    }
}

function drawGrid(sw, sh, scale, contrastValue) {
    const contrast = contrastValue / 100;
    const minorAlpha = GRID_MINOR_BASE + contrast * 0.30;
    const majorAlpha = GRID_MAJOR_BASE + contrast * 0.46;

    ctx.fillStyle = `rgba(0, 0, 0, ${minorAlpha.toFixed(3)})`;
    for (let x = 0; x <= sw; x += 1) {
        if (x % 10 === 0) continue;
        const gx = x * scale;
        ctx.fillRect(gx, 0, 1, canvas.height);
    }
    for (let y = 0; y <= sh; y += 1) {
        if (y % 10 === 0) continue;
        const gy = y * scale;
        ctx.fillRect(0, gy, canvas.width, 1);
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${majorAlpha.toFixed(3)})`;
    for (let x = 0; x <= sw; x += 10) {
        const gx = x * scale;
        ctx.fillRect(gx, 0, 2, canvas.height);
    }
    for (let y = 0; y <= sh; y += 10) {
        const gy = y * scale;
        ctx.fillRect(0, gy, canvas.width, 2);
    }
}

function countStitchesByPalette(indexMap, paletteSize) {
    const counts = Array.from({ length: paletteSize }, () => 0);
    for (let i = 0; i < indexMap.length; i += 1) {
        const idx = indexMap[i];
        if (idx >= 0) counts[idx] += 1;
    }
    return counts;
}

function mapPaletteToThreads(palette) {
    return palette.map((color) => getNearestThread(color));
}

function getNearestThread(color) {
    let best = DMC_THREADS[0];
    let bestDistance = Number.MAX_VALUE;

    for (let i = 0; i < DMC_THREADS.length; i += 1) {
        const thread = DMC_THREADS[i];
        const dr = color.r - thread.r;
        const dg = color.g - thread.g;
        const db = color.b - thread.b;
        const distance = dr * dr + dg * dg + db * db;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = thread;
        }
    }

    return best;
}

function generatePalette(palette, threadMap, stitchCounts) {
    paletteGrid.innerHTML = '';

    palette.forEach((color, i) => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';

        const swatch = document.createElement('div');
        swatch.className = 'chip-swatch';
        swatch.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;

        const hex = document.createElement('span');
        hex.className = 'chip-hex';
        const thread = threadMap?.[i];
        const count = stitchCounts?.[i] || 0;
        const threadLabel = thread ? `DMC ${thread.code} ${thread.name}` : 'No thread match';
        hex.textContent = `${i + 1} | ${rgbToHex(color)} | ${threadLabel} | ${count} st`;

        chip.appendChild(swatch);
        chip.appendChild(hex);
        paletteGrid.appendChild(chip);
    });

    colorCountLabel.textContent = `${palette.length} yarn colors used`;
}

function rgbToHex(rgb) {
    return `#${[rgb.r, rgb.g, rgb.b]
        .map((value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        })
        .join('')
        .toUpperCase()}`;
}

function exportPrintablePatternSheet() {
    if (!lastPattern || !lastPattern.palette.length) return;

    const { sw, sh, palette, threadMap, stitchCounts, indexMap, meshCount, physWidth, physHeight } = lastPattern;

    const keyRows = palette.length;
    const pageWidth = Math.max(1200, sw * 16 + 420);
    const pageHeight = Math.max(1450, sh * 16 + 280, 240 + keyRows * 34 + 300);

    const outCanvas = document.createElement('canvas');
    const outCtx = outCanvas.getContext('2d');
    outCanvas.width = pageWidth;
    outCanvas.height = pageHeight;

    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, pageWidth, pageHeight);

    outCtx.fillStyle = '#111827';
    outCtx.font = 'bold 34px sans-serif';
    outCtx.fillText('MeshUp Printable Pattern Sheet', 36, 56);

    outCtx.font = '18px sans-serif';
    outCtx.fillText(`Stitch Count: ${sw} x ${sh}`, 36, 92);
    outCtx.fillText(`Mesh Count: ${meshCount}`, 36, 118);
    outCtx.fillText(`Physical Size: ${physWidth.toFixed(1)}" x ${physHeight.toFixed(1)}"`, 36, 144);
    outCtx.fillText(`Color Count: ${palette.length}`, 36, 170);

    const gridX = 36;
    const gridY = 210;
    const maxGridWidth = pageWidth - 360;
    const maxGridHeight = pageHeight - 280;
    const cellSize = Math.max(6, Math.floor(Math.min(maxGridWidth / sw, maxGridHeight / sh)));

    // White grid — numbers only, no cell color fill
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(gridX, gridY, sw * cellSize, sh * cellSize);

    outCtx.textAlign = 'center';
    outCtx.textBaseline = 'middle';
    outCtx.font = `bold ${Math.max(7, Math.floor(cellSize * 0.58))}px monospace`;
    outCtx.fillStyle = '#111827';

    for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
            const pIdx = indexMap[y * sw + x];
            const cx = gridX + x * cellSize;
            const cy = gridY + y * cellSize;

            if (pIdx < 0) {
                // Erased cell — light checkerboard to distinguish from blank
                outCtx.fillStyle = (x + y) % 2 === 0 ? '#d1d5db' : '#f9fafb';
                outCtx.fillRect(cx, cy, cellSize, cellSize);
                outCtx.fillStyle = '#111827';
                continue;
            }

            const symbol = GRID_SYMBOLS[pIdx] || String(pIdx + 1);
            outCtx.fillText(symbol, cx + cellSize / 2, cy + cellSize / 2);
        }
    }

    // Grid lines aligned to stitch boundaries
    outCtx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let x = 0; x <= sw; x += 1) {
        if (x % 10 === 0) continue;
        outCtx.fillRect(gridX + x * cellSize, gridY, 1, sh * cellSize);
    }
    for (let y = 0; y <= sh; y += 1) {
        if (y % 10 === 0) continue;
        outCtx.fillRect(gridX, gridY + y * cellSize, sw * cellSize, 1);
    }

    outCtx.fillStyle = 'rgba(0,0,0,0.48)';
    for (let x = 0; x <= sw; x += 10) {
        outCtx.fillRect(gridX + x * cellSize, gridY, 2, sh * cellSize);
    }
    for (let y = 0; y <= sh; y += 10) {
        outCtx.fillRect(gridX, gridY + y * cellSize, sw * cellSize, 2);
    }

    // Color key
    const keyX = gridX + sw * cellSize + 36;
    let keyY = gridY;

    outCtx.fillStyle = '#111827';
    outCtx.textAlign = 'left';
    outCtx.textBaseline = 'alphabetic';
    outCtx.font = 'bold 20px sans-serif';
    outCtx.fillText('Numbered Color Key', keyX, keyY - 12);

    outCtx.font = '15px sans-serif';
    const keyTextMaxWidth = Math.max(190, pageWidth - (keyX + 34) - 24);
    let rowY = keyY;

    for (let i = 0; i < palette.length; i += 1) {
        const color = palette[i];
        const thread = threadMap?.[i];
        const stitches = stitchCounts?.[i] || 0;

        outCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        outCtx.fillRect(keyX, rowY, 24, 20);
        outCtx.strokeStyle = 'rgba(0,0,0,0.25)';
        outCtx.strokeRect(keyX, rowY, 24, 20);

        outCtx.fillStyle = '#111827';
        const symbol = GRID_SYMBOLS[i] || String(i + 1);
        const threadText = thread ? `DMC ${thread.code} ${thread.name}` : 'No match';
        const lineText = `${symbol}  ${rgbToHex(color)}  ${threadText}  (${stitches} st)`;
        const lines = wrapTextLines(outCtx, lineText, keyTextMaxWidth);
        const baseY = rowY + 15;
        for (let l = 0; l < lines.length; l += 1) {
            outCtx.fillText(lines[l], keyX + 34, baseY + l * 16);
        }

        rowY += Math.max(30, lines.length * 16 + 8);
    }

    const link = document.createElement('a');
    link.download = 'meshup-printable-pattern.png';
    link.href = outCanvas.toDataURL('image/png');
    link.click();
}

function wrapTextLines(ctxRef, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (let i = 0; i < words.length; i += 1) {
        const candidate = current ? `${current} ${words[i]}` : words[i];
        if (ctxRef.measureText(candidate).width <= maxWidth) {
            current = candidate;
            continue;
        }

        if (current) {
            lines.push(current);
            current = words[i];
            continue;
        }

        // Single token exceeds width: split token greedily.
        let token = words[i];
        let part = '';
        for (let j = 0; j < token.length; j += 1) {
            const nextPart = part + token[j];
            if (ctxRef.measureText(nextPart).width > maxWidth && part) {
                lines.push(part);
                part = token[j];
            } else {
                part = nextPart;
            }
        }
        current = part;
    }

    if (current) lines.push(current);
    return lines;
}

function handleThresholdChange() {
    bgThresholdValLabel.textContent = bgThresholdInput.value;
    if (!bgRemovalMode || !previewSeed) return;

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
        hideEraserCursor();
    } else {
        bgStatus.textContent = 'Enable selection mode, hover to preview, then click to confirm.';
        clearHoverPreview();
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
            if (dx * dx + dy * dy < 36) return;
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
    if (sourceCanvas) updateProject();
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
    if (data[startIndex + 3] === 0) return new Uint8Array(total);

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
        if (data[dataPos + 3] === 0) continue;

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
                mask[idx - 1] + mask[idx + 1] + mask[idx - width] + mask[idx + width];

            if (neighbors <= 1) softened[idx] = 0;
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

    if (showGrid) {
        drawGrid(sw, sh, scale, gridContrast);
    }
}

function applyBackgroundColorChange() {
    if (!sourceCanvas) return;

    const newRGB = hexToRgb(bgColorPicker.value);
    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;

    const colorFreq = new Map();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colorFreq.set(key, (colorFreq.get(key) || 0) + 1);
    }
    if (colorFreq.size === 0) return;

    const mostCommonColor = Array.from(colorFreq.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const [oldR, oldG, oldB] = mostCommonColor.split(',').map(Number);

    const colorThreshold = 30;
    for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - oldR;
        const dg = data[i + 1] - oldG;
        const db = data[i + 2] - oldB;
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
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : { r: 255, g: 255, b: 255 };
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

    for (let py = Math.max(0, y - eraserBrushSize); py < Math.min(sourceCanvas.height, y + eraserBrushSize); py += 1) {
        for (let px = Math.max(0, x - eraserBrushSize); px < Math.min(sourceCanvas.width, x + eraserBrushSize); px += 1) {
            const dx = px - x;
            const dy = py - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                const idx = (py * width + px) * 4;
                const alphaDrop = Math.max(0, 255 * (1 - dist / radius));
                data[idx + 3] = Math.max(0, data[idx + 3] - alphaDrop);
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
