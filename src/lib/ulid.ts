const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number) {
  let value = time;
  let str = "";
  for (let i = 0; i < 10; i += 1) {
    str = ENCODING[value % 32] + str;
    value = Math.floor(value / 32);
  }
  return str;
}

function encodeRandom() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let str = "";
  for (let i = 0; i < bytes.length; i += 1) {
    str += ENCODING[bytes[i] % 32];
  }
  return str;
}

export function ulid() {
  return `${encodeTime(Date.now())}${encodeRandom()}`;
}
