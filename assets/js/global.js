let isFullscreen = false;
let zoomedIn = false;
let isHighRes = false;
let noImg = false;
let smallImg = false;
let page = window.location.pathname.split("/").pop();

const toggleModal = (id) => {
    ipcRenderer.send('toggleModal', id);
}

const isModalOpen = async () => {
    const response = await ipcRenderer.invoke('isModalOpen');
    return response;
}

const keyDown = async (e) => {
    if(e.ctrlKey && e.key.toLowerCase() === "h") {
        toggleModal("help");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "j") {
        toggleModal("about");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "k") {
        toggleModal("info");
    }

    // Need a loading animation. Delay for larger files is confusing.
    if(e.ctrlKey && e.key.toLowerCase() === "o") {
        if(!await isModalOpen() && !isFullscreen) {
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
        if(!await isModalOpen() && isHighRes && !noImg) {
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

    // why can't new file be opened whilst in fullscreen?
    if(e.key.toLowerCase() === "f") {
        if(!await isModalOpen() &&!noImg) {
            img.style.display = "none";
            if(!isFullscreen) {
                ipcRenderer.send('fullscreen');
                ipcRenderer.on('fullscreen-response', () => {
                    maxScreenSize = [window.screen.width, window.screen.height];
                    calculateImgSize();
                    document.getElementsByClassName('container')[0].style.borderRadius = "0px";
                    img.style.width = "auto";
                    if(!isHighRes) {
                        img.style.height = "auto";
                    }
                    img.style.display = "block";
                    isFullscreen = true;
                    resetPanzoom();
                });
            } else {
                maxScreenSize = [window.screen.width - 100, window.screen.height - 100];
                ipcRenderer.send('disableFullscreen');
                ipcRenderer.on('disableFullscreen-response', () => {
                    calculateImgSize();
                    document.getElementsByClassName('container')[0].style.borderRadius = "10px";
                    img.style.width = "100%";
                    if(isHighRes) {
                        img.style.height = "100%";
                    }
                    img.style.display = "block";
                    isFullscreen = false;
                    resetPanzoom();
                });
            }
        }
    }

    if(e.key.toLowerCase() === "c") {
        if(!await isModalOpen() && isHighRes && !noImg || smallImg) {
            let currentZoomScale = zoomInstance.getTransform().scale;
            if(isFullscreen && !zoomedIn && currentZoomScale <= 1) {
                zoomInstance.smoothMoveTo(maxScreenSize[0] / 2 - img.width / 2, maxScreenSize[1] / 2 - img.height / 2);
            } else if (smallImg) {
                zoomInstance.smoothMoveTo(400 / 2 - img.width / 2, 500 / 2 - img.height / 2);
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