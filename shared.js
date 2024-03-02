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

export { SHAPassgen };
window.filebytes = filebytes;
window.encout = encout;
window.onload = function () {
document.getElementById('downenc').style.display = 'none';
document.getElementById('downdec').style.display = 'none';
}