import { SHAPassgen } from './shared.js';
const textDecoder = new TextDecoder();


async function decrypt() {
    let key = await SHAPassgen(document.getElementById('Password').value)
    let content = document.getElementById('Content').value;
    content = await TRIPLEDESdecrypt(content, key);
    content = await decompress(content);
    content = await DESdecrypt(content, key);
    content = await decompress(content);
    content = await AESdecrypt(content, key);
    const prefixToRemove = "I'm nothing like yall";
    content = content.substring(prefixToRemove.length, content.length);
    content = await fromBase64(content);
    content = await UTF8GetString(content);
    console.log('Final decrypted string is: ' + content);
    document.getElementById('Output').value = content;
}
async function TRIPLEDESdecrypt(str, key) {
    let out = CryptoJS.TripleDES.decrypt(str, key);
    console.log('3DES decrypted: ' + out.toString(CryptoJS.enc.Utf8));
    return out.toString(CryptoJS.enc.Utf8);
}
async function decompress(str) {
    return new Promise((resolve, reject) => {
        const data = str.split('').map(function (e) {
            return e.charCodeAt(0);
        });
        const decompressedData = pako.ungzip(data);
        let decompressedStr = '';
        for (let i = 0; i < decompressedData.length; i += 10000) {
            let chunk = decompressedData.slice(i, i + 10000);
            decompressedStr += String.fromCharCode.apply(null, chunk);
        }
        resolve(decompressedStr);
        console.log('Decompressed string is: ' + decompressedStr);
        return decompressedStr;
    });
}
async function DESdecrypt(str, key) {
    let out = CryptoJS.DES.decrypt(str, key);
    console.log('DES decrypted: ' + out.toString(CryptoJS.enc.Utf8));
    return out.toString(CryptoJS.enc.Utf8);
}
async function AESdecrypt(str, key) {
    let out = CryptoJS.AES.decrypt(str, key);
    console.log('AES decrypted: ' + out.toString(CryptoJS.enc.Utf8));
    return out.toString(CryptoJS.enc.Utf8);
}
async function fromBase64(str) {
    let out = atob(str);
    console.log('String is: ' + out.toString());
    return out.toString();
}
async function UTF8GetString(str) {
    let numbers = str.split(',').map(Number);
    let uint8Array = new Uint8Array(numbers);
    let out = await textDecoder.decode(uint8Array);
    console.log('String is: ' + out.toString());
    return out.toString();
}

window.decrypt = decrypt;