import { scryptSync, timingSafeEqual } from "node:crypto";

const storedHash = "scrypt$16384$8$1$prbBcpZvfYCQwNaz7uI6pw$UT0nt67EMcMhAlccPoPFvhu_UTTUCt026keHgwTkLcf_NSBMK5cv6S-GAmc";
const password = "Receitasbell.com";

function verify(password, storedHash) {
  const parts = storedHash.split("$");
  const [algo, nRaw, rRaw, pRaw, saltRaw, digestRaw] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  const salt = Buffer.from(saltRaw, "base64url");
  const expected = Buffer.from(digestRaw, "base64url");
  const computed = scryptSync(password, salt, expected.length, { N, r, p });
  return timingSafeEqual(expected, computed);
}

console.log("Verification result:", verify(password, storedHash));
