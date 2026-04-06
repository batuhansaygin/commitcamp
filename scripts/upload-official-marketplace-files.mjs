/**
 * Uploads official CommitCamp marketplace assets to Supabase Storage (bucket: product-files).
 *
 * Prerequisites:
 *   - Migration 00042 applied (products.file_path set to match these keys).
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (loads apps/platform/.env.local if present).
 *
 * Usage (repo root):
 *   node scripts/upload-official-marketplace-files.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { config as loadEnv } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, "apps/platform/.env.local") });
loadEnv({ path: join(root, ".env") });
loadEnv({ path: join(root, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const assetsRoot = join(root, "scripts/marketplace-official-assets");

function readAsset(relPath) {
  return readFileSync(join(assetsRoot, relPath));
}

async function buildNextStarterZip() {
  const zip = new JSZip();
  zip.file(
    "README.md",
    `# CommitCamp Next.js SaaS Starter (minimal)

This is a **minimal** starter scaffold for learning and bootstrapping. Add auth, billing, and your own data layer.

\`\`\`bash
npm install
npm run dev
\`\`\`
`
  );
  zip.file(
    "package.json",
    JSON.stringify(
      {
        name: "commitcamp-nextjs-saas-starter",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          next: "^15.1.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          typescript: "^5.7.0",
          "@types/node": "^22.0.0",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
        },
      },
      null,
      2
    )
  );
  zip.file(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          module: "esnext",
          moduleResolution: "bundler",
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      },
      null,
      2
    )
  );
  zip.file("next-env.d.ts", '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n');
  zip.file(
    "app/layout.tsx",
    `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 24 }}>{children}</body>
    </html>
  );
}
`
  );
  zip.file(
    "app/page.tsx",
    `export default function Page() {
  return (
    <main>
      <h1>CommitCamp SaaS Starter</h1>
      <p>Replace this page with your landing and dashboard routes.</p>
    </main>
  );
}
`
  );
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function upload(path, body, contentType) {
  const { error } = await supabase.storage.from("product-files").upload(path, body, {
    upsert: true,
    contentType,
  });
  if (error) throw new Error(`${path}: ${error.message}`);
  console.log("OK", path);
}

async function main() {
  await upload(
    "official/typescript-complete-cheat-sheet/cheatsheet.md",
    readAsset("typescript-complete-cheat-sheet/cheatsheet.md"),
    "text/markdown"
  );
  await upload(
    "official/system-design-interview-guide/guide.md",
    readAsset("system-design-interview-guide/guide.md"),
    "text/markdown"
  );
  await upload(
    "official/devops-docker-cheat-sheet/cheatsheet.md",
    readAsset("devops-docker-cheat-sheet/cheatsheet.md"),
    "text/markdown"
  );
  await upload(
    "official/algorithm-patterns-pack/patterns.md",
    readAsset("algorithm-patterns-pack/patterns.md"),
    "text/markdown"
  );

  const zipBuffer = await buildNextStarterZip();
  await upload("official/nextjs-saas-starter-kit/starter.zip", zipBuffer, "application/zip");

  console.log("\nAll official files uploaded. Verify products.file_path matches migration 00042.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
