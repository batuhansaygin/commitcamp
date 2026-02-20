/**
 * Seed script: downloads Twemoji PNG icons for each seeded achievement
 * and uploads them to Supabase Storage, then updates icon_url in the DB.
 *
 * Run once:  node scripts/seed-achievement-icons.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env vars ──────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
const envText = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envText.split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY  = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Twemoji base URL (MIT licensed) ──────────────────────────────────────────
const TWEMOJI = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

/**
 * Map achievement ID → twemoji filename (without .png)
 * Twemoji uses lowercase hex codepoints joined by hyphens, ignoring FE0F variation selector.
 */
const EMOJI_MAP = {
  // MILESTONE: Posts
  "a1000000-0000-0000-0000-000000000001": "1f680",     // 🚀
  "a1000000-0000-0000-0000-000000000002": "1f4dd",     // 📝
  "a1000000-0000-0000-0000-000000000003": "270d",      // ✍️
  "a1000000-0000-0000-0000-000000000004": "1f4d6",     // 📖
  "a1000000-0000-0000-0000-000000000005": "1f58a",     // 🖊️
  "a1000000-0000-0000-0000-000000000006": "1f4da",     // 📚
  // MILESTONE: Comments
  "a1000000-0000-0000-0000-000000000011": "1f4ac",     // 💬
  "a1000000-0000-0000-0000-000000000012": "1f5e3",     // 🗣️
  "a1000000-0000-0000-0000-000000000013": "1f4e2",     // 📢
  "a1000000-0000-0000-0000-000000000014": "1f399",     // 🎙️
  // MILESTONE: Snippets
  "a1000000-0000-0000-0000-000000000021": "1f4bb",     // 💻
  "a1000000-0000-0000-0000-000000000022": "1f3a8",     // 🎨
  "a1000000-0000-0000-0000-000000000023": "1f5c2",     // 🗂️
  "a1000000-0000-0000-0000-000000000024": "1f3db",     // 🏛️
  // MILESTONE: Reactions
  "a1000000-0000-0000-0000-000000000031": "2764",      // ❤️
  "a1000000-0000-0000-0000-000000000032": "2b50",      // ⭐
  "a1000000-0000-0000-0000-000000000033": "1f31f",     // 🌟
  "a1000000-0000-0000-0000-000000000034": "2728",      // ✨
  "a1000000-0000-0000-0000-000000000035": "1f48e",     // 💎
  // STREAK
  "a2000000-0000-0000-0000-000000000001": "1f525",     // 🔥
  "a2000000-0000-0000-0000-000000000002": "26a1",      // ⚡
  "a2000000-0000-0000-0000-000000000003": "1f30a",     // 🌊
  "a2000000-0000-0000-0000-000000000004": "1f4aa",     // 💪
  "a2000000-0000-0000-0000-000000000005": "1f3af",     // 🎯
  "a2000000-0000-0000-0000-000000000006": "1f6e1",     // 🛡️
  "a2000000-0000-0000-0000-000000000007": "2694",      // ⚔️
  "a2000000-0000-0000-0000-000000000008": "1f3c6",     // 🏆
  "a2000000-0000-0000-0000-000000000009": "1f947",     // 🥇
  // COMMUNITY
  "a3000000-0000-0000-0000-000000000001": "1f465",     // 👥
  "a3000000-0000-0000-0000-000000000002": "1f91d",     // 🤝
  "a3000000-0000-0000-0000-000000000003": "1f4e3",     // 📣
  "a3000000-0000-0000-0000-000000000004": "1f30d",     // 🌍
  "a3000000-0000-0000-0000-000000000005": "1f517",     // 🔗
  "a3000000-0000-0000-0000-000000000006": "1f98b",     // 🦋
  "a3000000-0000-0000-0000-000000000007": "1f310",     // 🌐
  // SKILL
  "a4000000-0000-0000-0000-000000000001": "2694",      // ⚔️
  "a4000000-0000-0000-0000-000000000002": "1f94a",     // 🥊
  "a4000000-0000-0000-0000-000000000003": "1f3f9",     // 🏹
  "a4000000-0000-0000-0000-000000000004": "1f451",     // 👑
  // LEVEL
  "a5000000-0000-0000-0000-000000000001": "1f331",     // 🌱
  "a5000000-0000-0000-0000-000000000002": "1f33f",     // 🌿
  "a5000000-0000-0000-0000-000000000003": "1f333",     // 🌳
  "a5000000-0000-0000-0000-000000000004": "26a1",      // ⚡
  "a5000000-0000-0000-0000-000000000005": "1f525",     // 🔥
  "a5000000-0000-0000-0000-000000000006": "1f4ab",     // 💫
  "a5000000-0000-0000-0000-000000000007": "1f31f",     // 🌟
  // EXPLORER
  "a6000000-0000-0000-0000-000000000001": "1f463",     // 👣
  "a6000000-0000-0000-0000-000000000002": "1f5fa",     // 🗺️
  "a6000000-0000-0000-0000-000000000003": "1f9ed",     // 🧭
  "a6000000-0000-0000-0000-000000000004": "1f52d",     // 🔭
  "a6000000-0000-0000-0000-000000000005": "1f680",     // 🚀
  "a6000000-0000-0000-0000-000000000006": "1f30c",     // 🌌
  // QUALITY
  "a7000000-0000-0000-0000-000000000001": "1f49d",     // 💝
  "a7000000-0000-0000-0000-000000000002": "1f338",     // 🌸
  "a7000000-0000-0000-0000-000000000003": "1f386",     // 🎆
  // SPECIAL
  "a8000000-0000-0000-0000-000000000001": "1f305",     // 🌅
  "a8000000-0000-0000-0000-000000000002": "1f9ea",     // 🧪
  "a8000000-0000-0000-0000-000000000003": "26a1",      // ⚡
  "a8000000-0000-0000-0000-000000000004": "1f95e",     // 🥞
  "a8000000-0000-0000-0000-000000000005": "1f48e",     // 💎
};

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const entries = Object.entries(EMOJI_MAP);
  console.log(`\nSeeding ${entries.length} achievement icons...\n`);

  let ok = 0, fail = 0;

  for (const [achievementId, twemojiCode] of entries) {
    const url = `${TWEMOJI}/${twemojiCode}.png`;
    const storagePath = `icons/${twemojiCode}.png`;

    try {
      // Download the PNG
      const buffer = await downloadBuffer(url);

      // Upload (idempotent — overwrite if already exists)
      const { error: uploadErr } = await supabase.storage
        .from("achievement-icons")
        .upload(storagePath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("achievement-icons")
        .getPublicUrl(storagePath);

      // Update the achievement
      const { error: updateErr } = await supabase
        .from("achievements")
        .update({ icon_url: publicUrl })
        .eq("id", achievementId);

      if (updateErr) throw updateErr;

      console.log(`✓  ${achievementId.slice(-4)}  ${twemojiCode}.png`);
      ok++;
    } catch (err) {
      console.error(`✗  ${achievementId.slice(-4)}  ${twemojiCode}  →  ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} succeeded, ${fail} failed.\n`);
}

main();
