import { scryptSync, randomBytes } from "node:crypto";
import fs from "node:fs";

const HASH_ALGO = "scrypt";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

async function hashAdminPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    HASH_ALGO,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

hashAdminPassword("Receitasbell.com").then(h => {
  fs.writeFileSync("new_hash.txt", h);
  console.log("Hash saved to new_hash.txt");
});
