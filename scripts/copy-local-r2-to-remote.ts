#!/usr/bin/env bun
/**
 * Copy workspace images from local R2 → remote R2.
 *
 * The original migration uploaded to local R2 (missing --remote flag).
 * This script reads the R2 keys from D1, downloads from local R2,
 * and re-uploads to remote R2.
 *
 * Usage:
 *   bun run scripts/copy-local-r2-to-remote.ts
 */

import { execSync } from 'child_process';

const DB_NAME = 'corenet-db';
const R2_BUCKET = 'corenet-images';

function wranglerD1(sql: string): string {
	return execSync(
		`npx wrangler d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}" --json`,
		{ encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: process.cwd() }
	);
}

function parseD1Result<T>(raw: string): T[] {
	const parsed = JSON.parse(raw);
	const results = Array.isArray(parsed) ? parsed : [parsed];
	return results[0]?.results ?? [];
}

async function main() {
	console.log('Fetching R2 keys from D1...');

	const raw = wranglerD1(
		"SELECT id, image_data FROM workspace_images WHERE image_data LIKE 'workspaces/%' ORDER BY created_at"
	);
	const rows = parseD1Result<{ id: string; image_data: string }>(raw);

	console.log(`Found ${rows.length} images to copy local → remote.\n`);

	if (rows.length === 0) {
		console.log('Nothing to copy!');
		return;
	}

	let success = 0;
	let failed = 0;

	for (const row of rows) {
		const key = row.image_data;
		process.stdout.write(`[${success + failed + 1}/${rows.length}] ${key}... `);

		const tmpFile = `/tmp/r2-copy-${Date.now()}.bin`;

		try {
			// Download from local R2
			execSync(`npx wrangler r2 object get "${R2_BUCKET}/${key}" --local --file="${tmpFile}"`, {
				encoding: 'utf-8',
				stdio: 'pipe',
				cwd: process.cwd()
			});

			// Upload to remote R2
			execSync(
				`npx wrangler r2 object put "${R2_BUCKET}/${key}" --remote --file="${tmpFile}" --content-type="image/webp"`,
				{ encoding: 'utf-8', stdio: 'pipe', cwd: process.cwd() }
			);

			const size = (await Bun.file(tmpFile).size) / 1024;
			console.log(`OK (${size.toFixed(0)}KB)`);
			success++;
		} catch (err) {
			console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
			failed++;
		} finally {
			try {
				execSync(`rm -f "${tmpFile}"`);
			} catch {}
		}
	}

	console.log(`\nDone! ${success} copied to remote R2, ${failed} failed.`);
}

main().catch(console.error);
