const { ipcRenderer } = require("electron");

let modals = [];

ipcRenderer.on('toggleModal', (e, arg) => {
    for(let i=0;i<modals.length;i++) {
        modals[i].style.display = "none";
    }
    modals[arg[0]].style.display = "block";
});

ipcRenderer.on('setExifData', (e, arg) => {
    console.log(arg);
    let metaTable = document.getElementById("metaTable");
    metaTable.innerHTML = "";
    metaTable.insertAdjacentHTML('beforeend', '<tr><th>Property</th><th>Value</th></tr>');
    for(let key in arg.imageSize) {
        metaTable.insertAdjacentHTML('beforeend', `<tr><td>${key}</td><td>${arg.imageSize[key]}</td></tr>`);
    }
    for(let key in arg.tags) {
        if(key == "ModifyDate" || key == "CreateDate") {
            let tempDate = new Date(0)
            tempDate.setUTCSeconds(arg.tags[key]);
            tempDate.toLocaleString();
            // console.log(tempDate);
            // arg.tags[key] = tempDate;
            // console.log(key);
            // console.log(arg.tags[key]);
        }
        metaTable.insertAdjacentHTML('beforeend', `<tr><td>${key}</td><td>${arg.tags[key]}</td></tr>`);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    modals = document.getElementsByClassName('modal');
});