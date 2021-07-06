let isFullscreen = false;
let zoomedIn = false;
let isHighRes = false;
let noImg = false;
let smallImg = false;
let page = window.location.pathname.split("/").pop();

const toggleModal = (id) => {
    ipcRenderer.send('toggleModal', id);
}

const keyDown = (e) => {
    if(e.ctrlKey && e.key.toLowerCase() === "h") {
        toggleModal("help");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "j") {
        toggleModal("about");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "k") {
        toggleModal("info");
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
    if(page == "index.html") {
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
    }

    document.addEventListener('keydown', keyDown, false);
});