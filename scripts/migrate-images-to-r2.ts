#!/usr/bin/env bun
/**
 * One-off migration: move base64 workspace images from D1 → R2.
 *
 * For each row where image_data starts with "data:image/":
 *   1. Decode base64 → binary
 *   2. Upload to R2 as workspaces/<sessionId>/<imageId>.<ext>
 *   3. Update the D1 row to store the R2 key instead
 *
 * Usage:
 *   bun run scripts/migrate-images-to-r2.ts
 *
 * Prerequisites:
 *   - wrangler authenticated (`npx wrangler whoami`)
 *   - R2 bucket "corenet-images" exists
 *   - D1 database "corenet-db" is accessible
 */

import { execSync } from 'child_process';

const DB_NAME = 'corenet-db';
const R2_BUCKET = 'corenet-images';

interface ImageRow {
	id: string;
	session_id: string;
	image_data: string;
}

function wranglerD1(sql: string): string {
	return execSync(
		`npx wrangler d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}" --json`,
		{ encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, cwd: process.cwd() }
	);
}

function parseD1Result<T>(raw: string): T[] {
	// wrangler outputs JSON array of result sets
	const parsed = JSON.parse(raw);
	// Handle both array and object formats
	const results = Array.isArray(parsed) ? parsed : [parsed];
	return results[0]?.results ?? [];
}

async function uploadToR2(key: string, data: Uint8Array, contentType: string): Promise<void> {
	// Write binary to temp file, upload via wrangler
	const tmpFile = `/tmp/r2-upload-${Date.now()}.bin`;
	await Bun.write(tmpFile, data);
	try {
		execSync(
			`npx wrangler r2 object put "${R2_BUCKET}/${key}" --file="${tmpFile}" --content-type="${contentType}"`,
			{ encoding: 'utf-8', stdio: 'pipe', cwd: process.cwd() }
		);
	} finally {
		(await Bun.file(tmpFile).exists()) && execSync(`rm -f "${tmpFile}"`);
	}
}

function decodeBase64DataUri(dataUri: string): { mime: string; ext: string; bytes: Uint8Array } {
	const [header, base64] = dataUri.split(',');
	const mime = header.match(/:(.*?);/)?.[1] ?? 'image/webp';
	const ext = mime.split('/')[1] ?? 'webp';
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return { mime, ext, bytes };
}

async function main() {
	console.log('Fetching base64 images from D1...');

	// Get IDs first (image_data is too large for --json in a single query)
	const idsRaw = wranglerD1(
		"SELECT id, session_id FROM workspace_images WHERE image_data LIKE 'data:image/%' ORDER BY created_at"
	);
	const ids = parseD1Result<{ id: string; session_id: string }>(idsRaw);

	console.log(`Found ${ids.length} base64 images to migrate.\n`);

	if (ids.length === 0) {
		console.log('Nothing to migrate!');
		return;
	}

	let success = 0;
	let failed = 0;

	for (const row of ids) {
		process.stdout.write(`[${success + failed + 1}/${ids.length}] ${row.id}... `);

		try {
			// Fetch image_data for this single row
			const dataRaw = wranglerD1(`SELECT image_data FROM workspace_images WHERE id = '${row.id}'`);
			const dataRows = parseD1Result<{ image_data: string }>(dataRaw);
			if (!dataRows[0]?.image_data) {
				console.log('SKIP (no data)');
				continue;
			}

			const dataUri = dataRows[0].image_data;
			if (!dataUri.startsWith('data:image/')) {
				console.log('SKIP (already R2 key)');
				continue;
			}

			// Decode
			const { mime, ext, bytes } = decodeBase64DataUri(dataUri);
			const key = `workspaces/${row.session_id}/${row.id}.${ext}`;

			// Upload to R2
			await uploadToR2(key, bytes, mime);

			// Update D1 row to store R2 key
			wranglerD1(`UPDATE workspace_images SET image_data = '${key}' WHERE id = '${row.id}'`);

			console.log(`OK → ${key} (${(bytes.length / 1024).toFixed(0)}KB)`);
			success++;
		} catch (err) {
			console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
			failed++;
		}
	}

	console.log(`\nDone! ${success} migrated, ${failed} failed.`);

	if (success > 0) {
		// Verify DB size reduction
		const sizeRaw = wranglerD1('SELECT COUNT(*) as cnt FROM workspace_images');
		console.log('Verify by checking DB size on next query.');
	}
}

main().catch(console.error);
