// Check if Web Crypto API is available and secure
function checkCryptoSupport() {
    if (!window.crypto?.subtle) {
        throw new Error('Web Crypto API not available. Use HTTPS or a modern browser.');
    }
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('Warning: Not using HTTPS. Encryption may not be fully secure.');
    }
}

// Initialize crypto check on load
if (typeof window !== 'undefined') {
    checkCryptoSupport();
}

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

    // Clear password buffer from memory immediately after use
    secureWipe(passwordBuffer);

    // First round: PBKDF2 with SHA-256
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 600000, // OWASP 2023 recommendation for SHA-256
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    // Second round: Additional PBKDF2 with SHA-512 for extra security
    const firstKey = new Uint8Array(derivedBits);
    const secondKeyMaterial = await crypto.subtle.importKey(
        'raw',
        firstKey,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const finalKey = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000, // Additional rounds with SHA-512
            hash: 'SHA-512'
        },
        secondKeyMaterial,
        256
    );

    const key = new Uint8Array(finalKey);
    
    // Clear intermediate key from memory
    secureWipe(firstKey);
    
    return { key, salt };
}

async function encrypt(data, password) {
    try {
        const { key, salt } = await generateKey(password);

        // Generate 12-byte nonce for GCM (recommended size)
        const nonce = crypto.getRandomValues(new Uint8Array(12));

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        // Create associated data for additional authentication
        const version = new TextEncoder().encode('FMB4');
        const timestamp = new Uint8Array(8);
        const now = Date.now();
        // Store timestamp in big-endian format
        for (let i = 7; i >= 0; i--) {
            timestamp[7 - i] = (now >> (i * 8)) & 0xff;
        }
        
        // Combine version, salt, and timestamp as associated data
        const associatedData = new Uint8Array(version.length + salt.length + timestamp.length);
        associatedData.set(version, 0);
        associatedData.set(salt, version.length);
        associatedData.set(timestamp, version.length + salt.length);

        const inputData = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: nonce,
                additionalData: associatedData // This will be authenticated but not encrypted
            },
            cryptoKey,
            inputData
        );

        // AES-GCM returns ciphertext + authentication tag combined
        const encryptedArray = new Uint8Array(encrypted);
        
        // Combine: version + salt + timestamp + nonce + encrypted data (which includes auth tag at the end)
        const result = new Uint8Array(version.length + salt.length + timestamp.length + nonce.length + encryptedArray.length);
        result.set(version, 0);
        result.set(salt, version.length);
        result.set(timestamp, version.length + salt.length);
        result.set(nonce, version.length + salt.length + timestamp.length);
        result.set(encryptedArray, version.length + salt.length + timestamp.length + nonce.length);

        // Clear sensitive data from memory
        secureWipe(key);

        return result;
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
}

async function decrypt(encryptedData, password) {
    try {
        // Validate minimum length (4 + 16 + 8 + 12 + 16 = 56 bytes minimum)
        if (encryptedData.length < 56) { 
            throw new Error('Invalid encrypted data: too short');
        }

        // Check version header
        const version = new TextDecoder().decode(encryptedData.slice(0, 4));
        if (version !== 'FMB4') {
            throw new Error('Invalid or unsupported file format');
        }

        const salt = encryptedData.slice(4, 20);
        const timestamp = encryptedData.slice(20, 28);
        const nonce = encryptedData.slice(28, 40); // 12-byte nonce
        const data = encryptedData.slice(40); // Encrypted data + auth tag

        // Reconstruct associated data
        const versionBytes = new TextEncoder().encode('FMB4');
        const associatedData = new Uint8Array(versionBytes.length + salt.length + timestamp.length);
        associatedData.set(versionBytes, 0);
        associatedData.set(salt, versionBytes.length);
        associatedData.set(timestamp, versionBytes.length + salt.length);

        const { key } = await generateKey(password, salt);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: nonce,
                additionalData: associatedData // Must match what was used during encryption
            },
            cryptoKey,
            data
        );

        // Clear sensitive data from memory
        secureWipe(key);

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

    // Limit text input size (1MB)
    const MAX_TEXT_SIZE = 1024 * 1024;
    if (input.length > MAX_TEXT_SIZE) {
        output.textContent = 'Error: Text too large. Maximum size is 1MB.';
        return;
    }

    try {
        if (action === 'encrypt') {
            showProgress('Encrypting text');
            const encrypted = await encrypt(input, password);
            output.textContent = btoa(String.fromCharCode.apply(null, encrypted));
        } else {
            showProgress('Decrypting text');
            
            // Validate base64 input
            try {
                atob(input);
            } catch (base64Error) {
                throw new Error('Invalid encrypted text format: ' + base64Error.message);
            }
            
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
    
    // Check file size limits (100MB for safety)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
        output.textContent = 'Error: File too large. Maximum size is 100MB.';
        return;
    }
    
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            showProgress(action === 'encrypt' ? 'Encrypting file' : 'Decrypting file');
            
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
            a.download = action === 'encrypt' ? file.name + '.fmbv4' : file.name.replace(/\.fmbv4$/, '');
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

// Progress indication for better UX
function showProgress(message) {
    const output = document.getElementById('output');
    output.textContent = message + '...';
}

// Utility function to securely clear sensitive data from memory
function secureWipe(buffer) {
    if (buffer instanceof Uint8Array) {
        crypto.getRandomValues(buffer); // Overwrite with random data
        buffer.fill(0); // Then fill with zeros
    }
}