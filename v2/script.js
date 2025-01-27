function generateKey(password) {
    const key = new Uint8Array(32);
    let hash = 0;

    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash = hash & hash;
    }

    for (let i = 0; i < 32; i++) {
        hash = (hash * 1664525 + 1013904223) & 0xFFFFFFFF;
        key[i] = hash & 0xFF;
    }

    return key;
}

function generateStream(key, length) {
    const stream = new Uint8Array(length);
    const state = new Uint32Array(4);

    for (let i = 0; i < 4; i++) {
        state[i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) |
            (key[i * 4 + 2] << 8) | key[i * 4 + 3];
    }

    for (let i = 0; i < length; i++) {
        state[0] = (state[0] + state[1]) >>> 0;
        state[1] = ((state[1] << 7) | (state[1] >>> 25)) >>> 0;
        state[2] = (state[2] + state[3]) >>> 0;
        state[3] = ((state[3] << 13) | (state[3] >>> 19)) >>> 0;

        stream[i] = (state[0] ^ state[2]) & 0xFF;
    }

    return stream;
}

function processData(data, password) {
    try {
        const inputData = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
        const key = generateKey(password);
        const stream = generateStream(key, inputData.length);

        const output = new Uint8Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            output[i] = inputData[i] ^ stream[i];
        }

        return output;
    } catch (error) {
        throw new Error('Failed to process data: ' + error.message);
    }
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
            output.textContent = btoa(String.fromCharCode(...encrypted));
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

            const blob = new Blob([processed], {type: 'application/octet-stream'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            if (action === 'encrypt') {
                a.download = file.name + '.fmbv2';
            } else {
                a.download = file.name.replace(/\.fmbv2$/, '');
            }

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            output.textContent = `File ${action}ed successfully!`;
        } catch (error) {
            output.textContent = 'Error processing file: ' + error.message;
        }
    };

    reader.onerror = function () {
        output.textContent = 'Error reading file';
    };

    reader.readAsArrayBuffer(file);
}