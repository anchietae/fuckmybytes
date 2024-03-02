import { SHAPassgen } from './shared.js';
const textEncoder = new TextEncoder();

async function encrypt() {
    let key = await SHAPassgen(document.getElementById('Password').value)
    let content = document.getElementById('Content').value;
    content = await UTF8GetBytes(content);
    content = await toBase64(content);
    content = await AESencrypt(content, key);
    content = await compress(content);
    content = await DESencrypt(content, key);
    content = await compress(content);
    content = await TRIPLEDESencrypt(content, key);
    console.log('Final encrypted string is: ' + content);
    document.getElementById('Output').value = content;
}
async function UTF8GetBytes(str) {
    let out = await textEncoder.encode(str);
    console.log('UTF8 String bytes are: ' + out.toString());
    return out.toString();
}
async function toBase64(str) {
    let out = await btoa(str);
    console.log('Base64 String is: ' + out.toString());
    return out.toString();
}
async function AESencrypt(str, key) {
    let out = await CryptoJS.AES.encrypt(str, key);
    console.log('AES encrypted: ' + out.toString());
    return out.toString();
}
async function compress(str) {
    return new Promise((resolve, reject) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const options = {
            level: 9,
            memLevel: 9,
        };
        const compressedData = pako.gzip(data, options);
        const compressedStr = String.fromCharCode.apply(null, compressedData);
        resolve(compressedStr);
        console.log('Compressed string is: ' + compressedStr.toString());
        return compressedStr.toString();
    });
}
async function DESencrypt(str, key) {
    let out = await CryptoJS.DES.encrypt(str, key);
    console.log('DES encrypted: ' + out.toString());
    return out.toString();
}
async function TRIPLEDESencrypt(str, key) {
    let out = await CryptoJS.TripleDES.encrypt(str, key);
    console.log('3DES encrypted: ' + out.toString());
    return out.toString();
}

window.encrypt = encrypt;