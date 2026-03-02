import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

export type DbClient = BaseSQLiteDatabase<'async', unknown, typeof schema>;

const d1Cache = new WeakMap<object, ReturnType<typeof drizzleD1>>();
let localDbInstance: DbClient | null = null;

export function setLocalDb(db: DbClient) {
	localDbInstance = db;
}

export function getDb(platform?: App.Platform): DbClient {
	if (platform?.env?.DB) {
		const d1 = platform.env.DB;
		let cached = d1Cache.get(d1);
		if (!cached) {
			cached = drizzleD1(d1, { schema });
			d1Cache.set(d1, cached);
		}
		return cached as unknown as DbClient;
	}
	if (localDbInstance) return localDbInstance;
	throw new Error('No database available. Ensure platform.env.DB is set.');
}
