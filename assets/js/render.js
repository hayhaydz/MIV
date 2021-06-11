const { ipcRenderer } = require("electron");
const panzoom = require("panzoom");

let originalImageSize = [];
let newImageSize = [];
let maxScreenSize = [];
let imgData;
let img = document.getElementById('img');
let isFullscreen = false;
let zoomedIn = false;
let zoomInstance = panzoom(img, 
    {minZoom: 1,
    maxZoom: 6,
    bounds: true,
    boundsPadding: 1}
);

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
    console.log('hi');
    console.log(maxScreenSize);
    originalImageSize = [img.width, img.height];
    imgData = calculateAspectRatioFit(originalImageSize[0], originalImageSize[1], maxScreenSize[0], maxScreenSize[1]);
    newImageSize = [imgData.width, imgData.height];
    img.width = newImageSize[0];
    img.height = newImageSize[1];
}

const keyDown = (e) => {
    if(e.ctrlKey && e.key === "x") {
        ipcRenderer.send('close');
    }

    if(e.key === "z") {
        // MAKESURE TO CHECK WHAT CURRENT ZOOM LEVEL IS FIRST
        if(originalImageSize[0] > maxScreenSize[0] || originalImageSize[1] > maxScreenSize[1]) {
            if(!zoomedIn) {
                zoomInstance.smoothZoom(newImageSize[0] / 2, newImageSize[1] / 2, 2);
                zoomedIn = true;
            } else {
                zoomInstance.smoothZoom(newImageSize[0] / 2, newImageSize[1] / 2, 0);
                zoomedIn = false;
            }
        }
    }

    // if(e.key === "f") {
    //     if(!isFullscreen) {
    //         ipcRenderer.send('fullscreen');
    //         maxScreenSize = [maxScreenSize[0] + 100, maxScreenSize[1] + 100];
    //         calculateImgSize();
    //         zoomInstance.moveTo(maxScreenSize[0] / 2, maxScreenSize[1] / 2);
    //         isFullscreen = true;
    //     } else {
    //         ipcRenderer.send('disableFullscreen');
    //         maxScreenSize = [maxScreenSize[0] - 100, maxScreenSize[1] - 100];
    //         calculateImgSize();
    //         zoomInstance.moveTo(0, 0);
    //         isFullscreen = false;
    //     }

    //     zoomInstance.zoomAbs(0, 0, 1);
    // }
}

window.addEventListener('DOMContentLoaded', () => {
    img.onload = () => {
        img.setAttribute('draggable', false);
        maxScreenSize = [window.innerWidth - 100, window.innerHeight - 100];
        calculateImgSize();
        ipcRenderer.send('resize-window', newImageSize);
        ipcRenderer.on('resize-window-response', () => {
            document.body.style.overflow = "hidden";
            document.body.height = "100vh";
        });
    }

    document.addEventListener('keydown', keyDown, false);
});