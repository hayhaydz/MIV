const { ipcRenderer } = require("electron");

let modals = [];

ipcRenderer.on('toggleModal', (e, arg) => {
    for(let i=0;i<modals.length;i++) {
        modals[i].style.display = "none";
    }
    modals[arg[0]].style.display = "block";
});

window.addEventListener('DOMContentLoaded', () => {
    modals = document.getElementsByClassName('modal');
});