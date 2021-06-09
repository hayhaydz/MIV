const { ipcRenderer } = require("electron");

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
        return { width: srcWidth*ratio, height: srcHeight*ratio };
    } else {
        return { width: srcWidth, height: srcHeight };
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let img = document.getElementById('img');

    img.onload = () => {
        let maxWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let maxHeight = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
        let imgData = calculateAspectRatioFit(img.width, img.height, maxWidth, maxHeight);
        img.width = imgData.width;
        img.height = imgData.height;
        ipcRenderer.send('resize-window', [img.width, img.height]);
        ipcRenderer.on('resize-window-response', () => {
            img.style.width = "100%";
            img.style.height = "100%";
            document.body.style.overflow = "hidden";
            document.body.height = "100vh";
        });
    }
});