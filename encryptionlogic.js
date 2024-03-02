import { SHAPassgen } from './shared.js';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
let filehash = null;

async function encrypt() {
    document.getElementById('Output').value = '';
    let key = await SHAPassgen(document.getElementById('Password').value)
    let content = document.getElementById('Content').value;
    content = await UTF8GetBytes(content);
    content = await toBase64(content);
    content = "I'm nothing like yall" + content;
    console.log("I'm nothing like yall");
    content = await AESencrypt(content, key);
    content = await compress(content);
    content = await DESencrypt(content, key);
    content = await compress(content);
    content = await TRIPLEDESencrypt(content, key);
    document.getElementById('Output').value = content;
    // Delete content from variables, to prevent memory leaks
    content = '';
    key = '';
}
async function encryptFile() {
    document.getElementById('downenc').style.display = 'none';
    document.getElementById('downdec').style.display = 'none';
    let key = await SHAPassgen(document.getElementById('Password').value)
    let content = window.filebytes;
    // create a hash of the file
    let hash = await CryptoJS.SHA512(content);
    window.filehash = hash.toString();
    // logic
    content = await textEncoder.encode(content).toString();
    content = await AESencrypt(content, key);
    content = await DESencrypt(content, key);
    content = await TRIPLEDESencrypt(content, key);
    // get filetype from original file
    let filetype = document.getElementById('File').files[0].type;
    content = "fstype[" + filetype+ "]" + content;
    // get filename from original file
    let filename = document.getElementById('File').files[0].name;
    content = "fsname[" + filename + "]" + content;
    // calculate filesize
    let size = content.length;
    let sizekib = size / 1024;
    document.getElementById('filesize').innerText = sizekib + ' KiB';
    window.encout = content;
    content = '';
    key = '';
    document.getElementById('downenc').style.display = 'block';
}
async function downloadEnc() {
    const data = window.encout;
    const blob = new Blob([data], { type: 'encrypted/fuckmybytes' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = window.filehash + '.fmbf';
    link.click();
    URL.revokeObjectURL(url);
    window.encout = null;
}
async function UTF8GetBytes(str) {
    console.log('UTF8 is processing...')
    let out = await textEncoder.encode(str);
    console.log('UTF8 encoded, length ' + out.toString().length);
    return out.toString();
}
async function toBase64(str) {
    console.log('Base64 is processing...')
    let out = await btoa(str);
    console.log('Base64 encrypted, length ' + out.toString().length);
    return out.toString();
}
async function AESencrypt(str, key) {
    console.log('AES is processing...')
    let out = await CryptoJS.AES.encrypt(str, key);
    console.log('AES encrypted, length: ' + out.toString().length);
    return out.toString();
}
async function compress(str) {
    console.log('Compressing...')
    return new Promise((resolve, reject) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const options = {
            level: 9,
            memLevel: 9,
        };
        const compressedData = pako.gzip(data, options);
        let compressedStr = '';
        for (let i = 0; i < compressedData.length; i += 10000) {
            let chunk = compressedData.slice(i, i + 10000);
            compressedStr += String.fromCharCode.apply(null, chunk);
        }
        resolve(compressedStr);
        console.log('Compressed, length: ' + compressedStr.toString().length);
        return compressedStr.toString();
    });
}
async function DESencrypt(str, key) {
    console.log('DES is processing...')
    let out = await CryptoJS.DES.encrypt(str, key);
    console.log('DES encrypted, length: ' + out.toString().length);
    return out.toString();
}
async function TRIPLEDESencrypt(str, key) {
    console.log('3DES is processing...')
    let out = await CryptoJS.TripleDES.encrypt(str, key);
    console.log('3DES encrypted, length: ' + out.toString().length);
    return out.toString();
}

window.encrypt = encrypt;
window.encryptFile = encryptFile;
window.filehash = filehash;
window.downloadEnc = downloadEnc;
