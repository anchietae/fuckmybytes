async function generateKey(password, providedSalt = null) {
    const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    const key = new Uint8Array(derivedBits);
    return { key, salt };
}

async function encrypt(data, password) {
    try {
        const { key, salt } = await generateKey(password);

        const iv = crypto.getRandomValues(new Uint8Array(16));

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-CTR' },
            false,
            ['encrypt']
        );

        const inputData = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-CTR',
                counter: iv,
                length: 64
            },
            cryptoKey,
            inputData
        );

        const encryptedArray = new Uint8Array(encrypted);
        const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(encryptedArray, salt.length + iv.length);

        return result;
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
}

async function decrypt(encryptedData, password) {
    try {
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 32);
        const data = encryptedData.slice(32);

        const { key } = await generateKey(password, salt);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-CTR' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-CTR',
                counter: iv,
                length: 64
            },
            cryptoKey,
            data
        );

        return new Uint8Array(decrypted);
    } catch (error) {
        throw new Error('Decryption failed: ' + error.message);
    }
}

async function handleText(action) {
    const password = document.getElementById('password').value;
    const input = document.getElementById('text-input').value;
    const output = document.getElementById('output');

    if (!password || !input) {
        output.textContent = 'Please enter both text and password';
        return;
    }

    try {
        if (action === 'encrypt') {
            const encrypted = await encrypt(input, password);
            output.textContent = btoa(String.fromCharCode.apply(null, encrypted));
        } else {
            const encryptedData = Uint8Array.from(atob(input), c => c.charCodeAt(0));
            const decrypted = await decrypt(encryptedData, password);
            output.textContent = new TextDecoder().decode(decrypted);
        }
    } catch (error) {
        output.textContent = 'Error: ' + error.message;
    }
}

async function handleFile(action) {
    const password = document.getElementById('password').value;
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');

    if (!password || !fileInput.files.length) {
        output.textContent = 'Please select a file and enter a password';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            let processed;

            if (action === 'encrypt') {
                processed = await encrypt(data, password);
            } else {
                processed = await decrypt(data, password);
            }

            const blob = new Blob([processed], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = action === 'encrypt' ? file.name + '.fmbv2-rng' : file.name.replace(/\.fmbv2-rng$/, '');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            output.textContent = `File ${action}ed successfully!`;
        } catch (error) {
            output.textContent = 'Error: ' + error.message;
        }
    };

    reader.onerror = function() {
        output.textContent = 'Error reading file';
    };

    reader.readAsArrayBuffer(file);
}