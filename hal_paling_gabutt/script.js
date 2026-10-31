const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const frameSelect = document.getElementById('frame-select');
const filterSelect = document.getElementById('filter');
const statusText = document.getElementById('status-text');
const stripCanvas = document.getElementById('strip-canvas');
const ctx = stripCanvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');

let stream;
let currentTemplate = new Image();

// Semua frame sekarang berukuran seragam hasil generate
const framesConfig = {
    f1: { src: 'assets/f1_layout.jpg', startX: 175, startY: 717, photoWidth: 893, photoHeight: 522, gapY: 870 },
    archive: { src: 'assets/archive_layout.PNG', startX: 59, startY: 193, photoWidth: 481, photoHeight: 419, gapY: 443 },
    spiderman: { src: 'assets/ig_layout.png', startX: 88, startY: 62, photoWidth: 222, photoHeight: 222, gapY: 314 },
    pink: { src: 'assets/pink_layout.jpg', startX: 40, startY: 150, photoWidth: 320, photoHeight: 240, gapY: 290 },
    brown: { src: 'assets/brown_layout.jpg', startX: 40, startY: 150, photoWidth: 320, photoHeight: 240, gapY: 290 }
};

async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam:", err);
        statusText.innerText = "Gagal mengakses kamera.";
    }
}

filterSelect.addEventListener('change', () => {
    video.style.filter = filterSelect.value;
});

frameSelect.addEventListener('change', loadTemplate);

function loadTemplate() {
    const selected = frameSelect.value;
    const config = framesConfig[selected];
    
    currentTemplate.src = config.src;
    currentTemplate.onload = () => {
        stripCanvas.width = currentTemplate.width;
        stripCanvas.height = currentTemplate.height;
        ctx.drawImage(currentTemplate, 0, 0, stripCanvas.width, stripCanvas.height);
    };
    currentTemplate.onerror = () => {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Gambar tidak ditemukan di folder assets/', stripCanvas.width/2, stripCanvas.height/2);
    }
}

async function takePhotoStrip() {
    captureBtn.disabled = true;
    frameSelect.disabled = true;
    filterSelect.disabled = true;
    downloadBtn.style.display = 'none';
    
    const config = framesConfig[frameSelect.value];
    
    if(currentTemplate.complete && currentTemplate.naturalWidth !== 0) {
        ctx.drawImage(currentTemplate, 0, 0, stripCanvas.width, stripCanvas.height);
    }

    for (let i = 0; i < 3; i++) {
        for (let j = 3; j > 0; j--) {
            statusText.innerText = `Siap-siap foto ke-${i + 1} dalam... ${j}`;
            await new Promise(r => setTimeout(r, 1000));
        }
        statusText.innerText = `Jepret!`; 
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tCtx = tempCanvas.getContext('2d');
        
        tCtx.translate(tempCanvas.width, 0);
        tCtx.scale(-1, 1);
        tCtx.filter = filterSelect.value;
        
        const targetRatio = config.photoWidth / config.photoHeight;
        const videoRatio = tempCanvas.width / tempCanvas.height;
        
        let sourceWidth = tempCanvas.width;
        let sourceHeight = tempCanvas.height;
        let sourceX = 0;
        let sourceY = 0;
        
        if(videoRatio > targetRatio) {
            sourceWidth = tempCanvas.height * targetRatio;
            sourceX = (tempCanvas.width - sourceWidth) / 2;
        } else {
            sourceHeight = tempCanvas.width / targetRatio;
            sourceY = (tempCanvas.height - sourceHeight) / 2;
        }

        tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const currentY = config.startY + (i * config.gapY);
        
        ctx.drawImage(tempCanvas, sourceX, sourceY, sourceWidth, sourceHeight, config.startX, currentY, config.photoWidth, config.photoHeight);
        
        if(i < 2) {
            await new Promise(r => setTimeout(r, 800)); 
        }
    }

    statusText.innerText = "Photo Strip Selesai!";
    captureBtn.disabled = false;
    frameSelect.disabled = false;
    filterSelect.disabled = false;
    downloadBtn.style.display = 'block';
}

captureBtn.addEventListener('click', takePhotoStrip);
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `Photobooth_PTI_A_${frameSelect.value}.png`;
    link.href = stripCanvas.toDataURL('image/png');
    link.click();
});

initCamera();
stripCanvas.width = 400;
stripCanvas.height = 1100;
loadTemplate();
