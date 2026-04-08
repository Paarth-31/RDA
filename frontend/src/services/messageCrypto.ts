const subtle = window.crypto.subtle;

export interface CryptoSession {
  aesKey: CryptoKey;
  hmacKey: CryptoKey;
}

// ── 1. ECDH key generation ────────────────────────────────────────────────
export async function generateECDHKeyPair(): Promise<{
  keyPair: CryptoKeyPair;
  exportedPublic: JsonWebKey;
}> {
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const exportedPublic = await subtle.exportKey('jwk', keyPair.publicKey);
  return { keyPair, exportedPublic };
}

// ── 2. Import a received public key ──────────────────────────────────────
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

// ── 3. Internal: derive one key via HKDF ──────────────────────────────────
async function deriveOneKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: ArrayBuffer,
  info: ArrayBuffer,
  algorithm: AesDerivedKeyParams | HmacImportParams,
  usages: KeyUsage[]
): Promise<CryptoKey> {
  // Step A: ECDH → raw shared bits
  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );

  // Step B: import bits as HKDF source key
  const hkdfKey = await subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Step C: HKDF-SHA256 → final key
  return subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    hkdfKey,
    algorithm,
    false,
    usages
  );
}

// ── 4. Build full crypto session ──────────────────────────────────────────
export async function buildCryptoSession(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoSession> {
  const salt = new TextEncoder().encode('RDA-chat-salt-v1').buffer as ArrayBuffer;
  const aesInfo = new TextEncoder().encode('RDA-AES-GCM-v1').buffer as ArrayBuffer;
  const hmacInfo = new TextEncoder().encode('RDA-HMAC-SHA256-v1').buffer as ArrayBuffer;

  const [aesKey, hmacKey] = await Promise.all([
    deriveOneKey(
      myPrivateKey,
      theirPublicKey,
      salt,
      aesInfo,
      { name: 'AES-GCM', length: 256 },
      ['encrypt', 'decrypt']
    ),
    deriveOneKey(
      myPrivateKey,
      theirPublicKey,
      salt,
      hmacInfo,
      { name: 'HMAC', hash: 'SHA-256' },
      ['sign', 'verify']
    ),
  ]);

  return { aesKey, hmacKey };
}

// ── 5. Encrypt + sign ─────────────────────────────────────────────────────
// Wire format: [ 12B IV | ciphertext | 32B HMAC ]
export async function encryptMessage(
  session: CryptoSession,
  plaintext: string
): Promise<Uint8Array> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuf = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    session.aesKey,
    encoded
  );

  // HMAC covers IV + ciphertext so IV-swap attacks are also caught
  const ivPlusCipher = new Uint8Array(iv.length + ciphertextBuf.byteLength);
  ivPlusCipher.set(iv, 0);
  ivPlusCipher.set(new Uint8Array(ciphertextBuf), iv.length);

  const mac = await subtle.sign(
    'HMAC',
    session.hmacKey,
    ivPlusCipher
  );

  const result = new Uint8Array(ivPlusCipher.length + mac.byteLength);
  result.set(ivPlusCipher, 0);
  result.set(new Uint8Array(mac), ivPlusCipher.length);
  return result;
}

// ── 6. Verify HMAC then decrypt ───────────────────────────────────────────
export async function decryptMessage(
  session: CryptoSession,
  data: Uint8Array   // accepts Uint8Array — caller wraps ArrayBuffer with new Uint8Array(buf)
): Promise<string> {
  const IV_LEN = 12;
  const MAC_LEN = 32;

  if (data.length < IV_LEN + MAC_LEN + 1) {
    throw new Error('Payload too short — corrupted or wrong format');
  }

  const iv         = data.slice(0, IV_LEN);
  const mac        = data.slice(data.length - MAC_LEN);
  const ciphertext = data.slice(IV_LEN, data.length - MAC_LEN);
  const signed     = data.slice(0, data.length - MAC_LEN);

  const valid = await subtle.verify('HMAC', session.hmacKey, mac, signed);
  if (!valid) {
    throw new Error('HMAC verification failed — message may be tampered');
  }

  const plainBuf = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    session.aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plainBuf);
}