let filebytes = null;
let encout = null;
async function SHAPassgen(key) {
    let out = key;
    for (let i = 0; i < 100; i++) {
        out = await CryptoJS.SHA512(out);
    }
    console.log('Final password hash is: ' + out.toString());
    return out.toString();
}

async function loadfile() {
    let file = document.getElementById('File').files[0];
    // load file bytes into variable
    let reader = new FileReader();
    reader.onload = function (e) {
        window.filebytes = e.target.result;
    };
    reader.readAsText(file);
    console.log('File loaded');
}

export { SHAPassgen };
window.loadfile = loadfile;
window.filebytes = filebytes;
window.encout = encout;

window.onload = function () {
document.getElementById('downenc').style.display = 'none';
document.getElementById('downdec').style.display = 'none';
}