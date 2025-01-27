function generateKey(password) {
    const key = new Uint8Array(32);
    let sum = 0;

    for (let i = 0; i < password.length; i++) {
        sum = (sum + password.charCodeAt(i)) >>> 0;
        key[i % 32] = (key[i % 32] + password.charCodeAt(i) + sum) % 256;
    }

    for (let i = 0; i < 32; i++) {
        sum = (sum + key[i]) >>> 0;
        const j = (sum + i) % 32;
        [key[i], key[j]] = [key[j], key[i]];
    }

    return key;
}

function generateStream(key, length) {
    const stream = new Uint8Array(length);
    let a = key[0], b = key[1], c = key[2], d = key[3];

    for (let i = 0; i < length; i++) {
        a = (a + b) % 256;
        b = (b + c) % 256;
        c = (c + d) % 256;
        d = (d + a) % 256;

        const mix = ((a << 3) | (b >> 5)) & 0xFF;
        stream[i] = (mix + key[i % 32]) % 256;
    }

    return stream;
}

function processData(data, password) {
    const inputData = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    const key = generateKey(password);
    const stream = generateStream(key, inputData.length);

    const output = new Uint8Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
        output[i] = inputData[i] ^ stream[i];
    }

    return output;
}

function handleText(action) {
    const password = document.getElementById('password').value;
    const input = document.getElementById('text-input').value;
    const output = document.getElementById('output');

    if (!password || !input) {
        output.textContent = 'You forgot to enter text and password';
        return;
    }

    try {
        if (action === 'encrypt') {
            const encrypted = processData(input, password);
            output.textContent = btoa(String.fromCharCode.apply(null, encrypted));
        } else {
            try {
                const decoded = Uint8Array.from(atob(input), c => c.charCodeAt(0));
                const decrypted = processData(decoded, password);
                output.textContent = new TextDecoder().decode(decrypted);
            } catch (e) {
                output.textContent = 'Invalid data format.';
            }
        }
    } catch (error) {
        output.textContent = 'Error processing data: ' + error.message;
    }
}

function handleFile(action) {
    const password = document.getElementById('password').value;
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');

    if (!password || !fileInput.files.length) {
        output.textContent = 'You forgot to enter password and select a file';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const processed = processData(data, password);

            const blob = new Blob([processed]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name + (action === 'encrypt' ? '.fmbv2' : '');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            output.textContent = `File ${action}ed successfully!`;
        } catch (error) {
            output.textContent = 'Error processing file: ' + error.message;
        }
    };

    reader.readAsArrayBuffer(file);
}