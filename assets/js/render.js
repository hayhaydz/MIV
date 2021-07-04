const { ipcRenderer } = require("electron");
const panzoom = require("panzoom");

let originalImageSize = [];
let newImageSize = [];
let maxScreenSize = [];
let imgData;
let img = document.getElementById('img');

let isFullscreen = false;
let zoomedIn = false;
let isHighRes = false;
let noImg = false;
let smallImg = false;
let modalOpen = false;

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
        }
        zoomInstance = panzoom(img, zoomSettings);
        zoomInstance.moveTo(maxScreenSize[0] / 2 - newImageSize[0] / 2, maxScreenSize[1] / 2 - newImageSize[1] / 2);
        zoomInstance.zoomAbs(0, 0, 1);
    } else {
        if(!isHighRes) {
            zoomSettingsBP.maxZoom = 1;
        }
        if(!smallImg) {
            zoomInstance = panzoom(img, zoomSettingsBP);
        } else {
            zoomInstance = panzoom(img, zoomSettings);
            zoomInstance.moveTo(400 / 2 - newImageSize[0] / 2, 500 / 2 - newImageSize[1] / 2);
            zoomInstance.zoomAbs(0, 0, 1);
        }
    }
}

const openModal = (id) => {
    zoomInstance.dispose();
    let modal = document.getElementById(`${id}`);
    modal.style.display = "block";
    modalOpen = true;
}

const closeModal = (id) => {
    resetPanzoom();
    let modal = document.getElementById(`${id}`);
    modal.style.display = "none";
    modalOpen = false;
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
    // zoomInstance = panzoom(img, zoomSettingsBP);
    img.setAttribute('draggable', false);
    img.style.width = "auto";
    originalImageSize = [img.width, img.height];
    maxScreenSize = [window.screen.width - 100, window.screen.height - 100];
    if(originalImageSize[0] < maxScreenSize[0] || originalImageSize[1] < maxScreenSize[1]) {
        zoomInstance.dispose();
    } else {
        isHighRes = true;
    }
    calculateImgSize();
    if(newImageSize[0] < 400 || newImageSize[1] < 500) {
        ipcRenderer.send('resize-window', [400, 500]);
        smallImg = true;
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

const keyDown = (e) => {
    if(e.ctrlKey && e.key.toLowerCase() === "h") {
        if(!modalOpen) {
            openModal("help");
        } else {
            closeModal("help");
        }
    }

    if(e.ctrlKey && e.key.toLowerCase() === "j") {
        if(!modalOpen) {
            openModal("about");
        } else {
            closeModal("about");
        }
    }

    if(e.ctrlKey && e.key.toLowerCase() === "k") {
        if(!modalOpen) {
            openModal("info");
        } else {
            closeModal("info");
        }
    }

    if(e.ctrlKey && e.key.toLowerCase() === "o") {
        if(!isFullscreen) {
            ipcRenderer.send('chooseFile');
            ipcRenderer.on('chosenFile', (event, base64) => {
                const src = `data:image/jpg;base64,${base64}`;
                img.src = src;
                img.onload = () => {
                    img.width = img.naturalWidth;
                    img.height = img.naturalHeight;
                    initialSetup();
                    if(noImg) {
                        img.style.opacity = "1";
                        document.getElementById('backupText').style.display = "none";
                        noImg = false;
                    }
                }
            });
        }
    }

    if(e.ctrlKey && e.key.toLowerCase() === "x") {
        ipcRenderer.send('close');
    }

    if(e.key.toLowerCase() === "z") {
        if(isHighRes && !noImg) {
            let currentZoomScale = zoomInstance.getTransform().scale;
            if(!zoomedIn && currentZoomScale <= 1) {
                zoomInstance.smoothZoom(mousePosition.x, mousePosition.y, 2);
                zoomedIn = true;
            } else {
                if(isFullscreen) {
                    zoomInstance.smoothZoom(maxScreenSize[0] / 2, maxScreenSize[1] / 2, 0);
                } else {
                    zoomInstance.smoothZoom(newImageSize[0] / 2, newImageSize[1] / 2, 0);
                }
                zoomedIn = false;
            }
        }
    }

    if(e.key.toLowerCase() === "f") {
        if(!noImg) {
            if(!isFullscreen) {
                ipcRenderer.send('fullscreen');
                ipcRenderer.on('fullscreen-response', () => {
                    maxScreenSize = [window.screen.width, window.screen.height];
                    calculateImgSize();
                    img.style.width = "auto";
                    if(!isHighRes) {
                        img.style.height = "auto";
                    }
                    isFullscreen = true;
                    resetPanzoom();
                });
            } else {
                maxScreenSize = [window.screen.width - 100, window.screen.height - 100];
                ipcRenderer.send('disableFullscreen');
                ipcRenderer.on('disableFullscreen-response', () => {
                    calculateImgSize();
                    img.style.width = "100%";
                    img.style.height = "100%";
                    isFullscreen = false;
                    resetPanzoom();
                });
            }
        }
    }

    if(e.key.toLowerCase() === "c") {
        if(isHighRes && !noImg || smallImg) {
            let currentZoomScale = zoomInstance.getTransform().scale;
            if(isFullscreen && !zoomedIn && currentZoomScale <= 1) {
                zoomInstance.smoothMoveTo(maxScreenSize[0] / 2 - newImageSize[0] / 2, maxScreenSize[1] / 2 - newImageSize[1] / 2);
            } else if (smallImg) {
                zoomInstance.smoothMoveTo(400 / 2 - newImageSize[0] / 2, 500 / 2 - newImageSize[1] / 2);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if(img.src !== "data:,") {
        img.onload = () => {
            initialSetup();
        }
    } else {
        noImg = true;
        img.style.opacity = "0";
        ipcRenderer.send('resize-window', [400, 500]);
    }

    ipcRenderer.send('getFileData');
    ipcRenderer.on('getFileData-response', (event, arg) => {
        if (arg !==  "." || null) {
            const src = `data:image/jpg;base64,${arg}`;
            img.src = src;
            img.onload = () => {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
                document.getElementById('backupText').style.display = "none";
                if(noImg) {
                    img.style.opacity = "1";
                    noImg = false;
                    initialSetup();
                }
            }
        }
    });

    document.addEventListener('keydown', keyDown, false);
});