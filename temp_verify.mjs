import { scryptSync } from "node:crypto";

function verify(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length < 6) return false;
  const [algo, n, r, p, saltBase64, hashBase64] = parts;
  const salt = Buffer.from(saltBase64, "base64url");
  const derived = scryptSync(password, salt, 64, {
    N: parseInt(n),
    r: parseInt(r),
    p: parseInt(p),
  });
  return derived.toString("base64url") === hashBase64;
}

const p1 = "scrypt$16384$8$1$VFjwHlpCMjt30fWl18IVZA$P9i1-NXmubcy_RvoTZp9WnZ3_eYvKM-Ccfvrvg309n0vHumdq4JwdfmbJQAgaiJrDYspgSeTb3Ko3rjygfvr-A";
const p2 = "scrypt$16384$8$1$BInTJAtCx4wHJuAv8C3Smg$BVDHk-wtMXxz1p_EiQ1fczIZRsIkOJvPdBdbokhm6afdWBAUQKXg9tWBzrMsKPPgYQzc8I8PKNci0YzZcsWMww";

const results = {
  m1: verify("Receitas@2024!", p1),
  a1: verify("Receitas@2024!", p2),
  m2: verify("123", p1),
  a2: verify("123", p2)
};

console.log(JSON.stringify(results));
