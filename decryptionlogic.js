import { SHAPassgen } from './shared.js';
const textDecoder = new TextDecoder();


async function decrypt() {
    document.getElementById('Output').value = '';
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
    document.getElementById('Output').value = content;
    // Delete content from variables, to prevent memory leaks
    content = '';
    key = '';
}
async function TRIPLEDESdecrypt(str, key) {
    console.log('3DES decrypting...')
    let out = CryptoJS.TripleDES.decrypt(str, key);
    console.log('3DES decrypted, length: ' + out.toString(CryptoJS.enc.Utf8).length);
    return out.toString(CryptoJS.enc.Utf8);
}
async function decompress(str) {
    console.log('Decompressing...')
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
        console.log('Decompressed, length: ' + decompressedStr.length);
        return decompressedStr;
    });
}
async function DESdecrypt(str, key) {
    console.log('DES decrypting...')
    let out = CryptoJS.DES.decrypt(str, key);
    console.log('DES decrypted, length: ' + out.toString(CryptoJS.enc.Utf8).length);
    return out.toString(CryptoJS.enc.Utf8);
}
async function AESdecrypt(str, key) {
    console.log('AES decrypting...')
    let out = CryptoJS.AES.decrypt(str, key);
    console.log('AES decrypted, length: ' + out.toString(CryptoJS.enc.Utf8).length);
    return out.toString(CryptoJS.enc.Utf8);
}
async function fromBase64(str) {
    console.log('Base64 is processing...')
    let out = atob(str);
    console.log('Base64 decrypted, length: ' + out.toString().length);
    return out.toString();
}
async function UTF8GetString(str) {
    console.log('UTF8 is processing...')
    let numbers = str.split(',').map(Number);
    let uint8Array = new Uint8Array(numbers);
    let out = await textDecoder.decode(uint8Array);
    console.log('UTF8 encoded, length ' + out.toString().length);
    return out.toString();
}

window.decrypt = decrypt;