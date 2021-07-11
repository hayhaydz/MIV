const { ipcRenderer } = require("electron");
const panzoom = require("panzoom");

let originalImageSize = [];
let newImageSize = [];
let maxScreenSize = [];
let imgData;
let img = document.getElementById('img');

let mousePosition = {
    x: -1,
    y: -1
}

let zoomSettingsBP = {
    minZoom: 1,
    maxZoom: 6,
    bounds: true,
    boundsPadding: 1 
}
let zoomSettings = {
    minZoom: 1,
    maxZoom: 6,
    bounds: true,
}
let zoomInstance = panzoom(img, zoomSettingsBP);

const resetPanzoom = () => {
    zoomInstance.dispose();
    if(isFullscreen) {
        if(!isHighRes) {
            zoomSettings.maxZoom = 1;
        } else {
            zoomSettings.maxZoom = 6;
        }
        zoomInstance = panzoom(img, zoomSettings);
        zoomInstance.moveTo(maxScreenSize[0] / 2 - img.width / 2, maxScreenSize[1] / 2 - img.height / 2);
        zoomInstance.zoomAbs(0, 0, 1);
    } else {
        if(!isHighRes) {
            zoomSettingsBP.maxZoom = 1;
            zoomSettings.maxZoom = 1;
        } else {
            zoomSettingsBP.maxZoom = 6;
            zoomSettings.maxZoom = 6;
        }
        if(!smallImg) {
            zoomInstance = panzoom(img, zoomSettingsBP);
        } else {
            zoomInstance = panzoom(img, zoomSettings);
            zoomInstance.moveTo(400 / 2 - img.width / 2, 500 / 2 - img.height / 2);
            zoomInstance.zoomAbs(0, 0, 1);
        }
    }
}

document.onmousemove = (event) => {
    mousePosition.x = event.pageX;
    mousePosition.y = event.pageY;
}

/**
 * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} srcWidth width of source image
 * @param {Number} srcHeight height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
 */
 const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
    if(srcWidth > maxWidth || srcHeight > maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return { width: Math.round(srcWidth*ratio), height: Math.round(srcHeight*ratio) };
    } else {
        return { width: srcWidth, height: srcHeight };
    }
}

const calculateImgSize = () => {
    imgData = calculateAspectRatioFit(originalImageSize[0], originalImageSize[1], maxScreenSize[0], maxScreenSize[1]);
    newImageSize = [imgData.width, imgData.height];
    img.width = newImageSize[0];
    img.height = newImageSize[1];
}

const initialSetup = () => {
    img.setAttribute('draggable', false);
    img.style.width = "auto";
    originalImageSize = [img.naturalWidth, img.naturalHeight];
    maxScreenSize = [window.screen.width - 100, window.screen.height - 100];
    if(originalImageSize[0] > maxScreenSize[0] || originalImageSize[1] > maxScreenSize[1]) {
        isHighRes = true;
    } else {
        isHighRes = false;
    }
    calculateImgSize();
    if(newImageSize[0] < 400 || newImageSize[1] < 500) {
        ipcRenderer.send('resize-window', [400, 500]);
        smallImg = true;
        isHighRes = false;
    } else {
        ipcRenderer.send('resize-window', newImageSize);
        smallImg = false;
    }
    ipcRenderer.on('resize-window-response', () => {
        document.body.style.overflow = "hidden";
        document.body.height = "100vh";
        resetPanzoom();
        if(smallImg) {
            img.classList.add("smallImg");
        } else {
            img.style.width = "100%";
            img.classList.remove("smallImg");
        }
    });
}

ipcRenderer.on('toggleModal', (e, arg) => {
    if(!arg[1]) {
        zoomInstance.dispose();
    } else {
        resetPanzoom();
    }
});