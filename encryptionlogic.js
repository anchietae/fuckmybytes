const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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
}

// Step 1: Generate a password hash instead of using the actual password
async function SHAPassgen(key) {
    let out = key;
    for (let i = 0; i < 100; i++) {
        out = await CryptoJS.SHA512(out);
    }
    console.log('Final password hash is: ' + out.toString());
    return out.toString();
}
// Step 2: Convert the string to UTF-8 bytes
async function UTF8GetBytes(str) {
    let out = await textEncoder.encode(str);
    console.log('UTF8 String bytes are: ' + out.toString());
    return out.toString();
}
// Step 3: Convert the UTF-8 bytes to Base64
async function toBase64(str) {
    let out = btoa(str);
    console.log('Base64 String is: ' + out.toString());
    return out.toString();
}
// Step 4: AES encrypt the Base64 string
async function AESencrypt(str, key) {
    let out = CryptoJS.AES.encrypt(str, key);
    console.log('AES encrypted: ' + out.toString());
    return out.toString();
}
// Step 5: Compress the AES encrypted string
async function compress(str) {
    let out = await LZUTF8.compress(str);
    console.log('Compressed string is: ' + out.toString());
    return out.toString();
}
// Step 6: DES encrypt the compressed string
async function DESencrypt(str, key) {
    let out = CryptoJS.DES.encrypt(str, key);
    console.log('DES encrypted: ' + out.toString());
    return out.toString();
}
// Since IDEA is not supported by anyone, I'm not going to implement it myself
// Step 7: Compress the DES encrypted string
// Step 8: TRIPLEDES encrypt the compressed string
async function TRIPLEDESencrypt(str, key) {
    let out = CryptoJS.TripleDES.encrypt(str, key);
    console.log('3DES encrypted: ' + out.toString());
    return out.toString();
}

async function decompress(str) {
    let numbers = str.split(',').map(Number);
    let uint8Array = new Uint8Array(numbers);
    let out = LZUTF8.decompress(uint8Array, {outputEncoding: "ByteArray"});
    console.log('Decompressed string is: ' + out.toString());
    return out.toString();
}

async function UTF8GetString(str) {
    let numbers = str.split(',').map(Number);
    let uint8Array = new Uint8Array(numbers);
    let out = await textDecoder.decode(uint8Array);
    console.log('String is: ' + out);
}


async function fromBase64(str) {
    let out = atob(str);
    console.log('String is: ' + out.toString());
}

window.encrypt = encrypt;
window.UTF8GetBytes = UTF8GetBytes;
window.SHAPassgen = SHAPassgen;
window.UTF8GetString = UTF8GetString;
window.toBase64 = toBase64;
window.fromBase64 = fromBase64;
window.compress = compress;
window.decompress = decompress;
window.AESencrypt = AESencrypt;