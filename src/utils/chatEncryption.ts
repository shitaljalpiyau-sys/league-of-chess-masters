// Simple encryption utility for game chat messages
// Uses game ID as seed to derive a shared key

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Generate a key from game ID
async function deriveKey(gameId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(gameId.padEnd(32, '0')),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('chess-game-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message
export async function encryptMessage(message: string, gameId: string): Promise<string> {
  try {
    const key = await deriveKey(gameId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(message)
    );

    // Combine IV and encrypted data, convert to base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; // Fallback to plain text if encryption fails
  }
}

// Decrypt a message
export async function decryptMessage(encryptedMessage: string, gameId: string): Promise<string> {
  try {
    const key = await deriveKey(gameId);
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted Message]'; // Show placeholder if decryption fails
  }
}
