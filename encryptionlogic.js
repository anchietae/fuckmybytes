const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function encrypt() {
    let key = await SHAPassgen(keydocument.getElementById('Password').value)
    let content = document.getElementById('Content').value;
    content = await UTF8GetBytes(content);
    content = await toBase64(content);
    content = await AESencrypt(content, key);
}

// Step 1: Generate a password hash instead of using the actual password
async function SHAPassgen(key) {
    let out = key;
    for (let i = 0; i < 100; i++) {
        out = await CryptoJS.SHA512(k);
    }
    console.log('Final password hash is: ' + out.toString());
    return out;
}
// Step 2: Convert the string to UTF-8 bytes
async function UTF8GetBytes(s) {
    let out = await textEncoder.encode(s);
    console.log('UTF8 String bytes are: ' + out.toString());
    return out;
}
// Step 3: Convert the UTF-8 bytes to Base64
async function toBase64(s) {
    let out = btoa(s);
    console.log('Base64 String is: ' + out.toString());
    return out;
}
// Step 4: AES encrypt the Base64 string
async function AESencrypt(s, k) {
    let out = CryptoJS.AES.encrypt(s, k);
    console.log('AES encrypted: ' + out.toString());
    return out;
}
// Step 5: Gzip compress the AES encrypted string
async function GZIPcompress(s) {

}

async function GZIPdecompress(s) {

}

async function UTF8GetString(s) {
    let numbers = s.split(',').map(Number);
    let uint8Array = new Uint8Array(numbers);
    let out = await textDecoder.decode(uint8Array);
    console.log('String is: ' + out);
}


async function fromBase64(s) {
    let out = atob(s);
    console.log('String is: ' + out.toString());
}

window.encrypt = encrypt;
window.UTF8GetBytes = UTF8GetBytes;
window.SHAPassgen = SHAPassgen;
window.UTF8GetString = UTF8GetString;
window.toBase64 = toBase64;
window.fromBase64 = fromBase64;
window.GZIPcompress = GZIPcompress;
window.GZIPdecompress = GZIPdecompress;