async function SHAPassgen(key) {
    let out = key;
    for (let i = 0; i < 100; i++) {
        out = await CryptoJS.SHA512(out);
    }
    console.log('Final password hash is: ' + out.toString());
    return out.toString();
}

export { SHAPassgen };