import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY Netlify environment variable.");
}

await mkdir("js", { recursive: true });

const safe = value => JSON.stringify(value);
const content = `export const SUPABASE_URL = ${safe(url)};\nexport const SUPABASE_ANON_KEY = ${safe(key)};\n`;

await writeFile("js/config.js", content, "utf8");
console.log("Generated js/config.js from Netlify environment variables.");
