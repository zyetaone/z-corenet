declare global {
	interface D1Database {
		prepare(query: string): D1PreparedStatement;
		dump(): Promise<ArrayBuffer>;
		batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
		exec(query: string): Promise<D1ExecResult>;
	}
	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement;
		first<T = unknown>(colName?: string): Promise<T | null>;
		run<T = unknown>(): Promise<D1Result<T>>;
		all<T = unknown>(): Promise<D1Result<T>>;
		raw<T = unknown>(): Promise<T[]>;
	}
	interface D1Result<T = unknown> {
		results?: T[];
		success: boolean;
		error?: string;
		meta: object;
	}
	interface D1ExecResult {
		count: number;
		duration: number;
	}

	interface R2Bucket {
		put(key: string, value: ArrayBufferView | ArrayBuffer | string | ReadableStream | Blob, options?: R2PutOptions): Promise<R2Object>;
		get(key: string): Promise<R2ObjectBody | null>;
		head(key: string): Promise<R2Object | null>;
		delete(key: string | string[]): Promise<void>;
		list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>;
	}
	interface R2PutOptions {
		httpMetadata?: { contentType?: string };
		customMetadata?: Record<string, string>;
	}
	interface R2Object {
		key: string;
		size: number;
		etag: string;
		httpMetadata?: { contentType?: string };
	}
	interface R2ObjectBody extends R2Object {
		arrayBuffer(): Promise<ArrayBuffer>;
		text(): Promise<string>;
		blob(): Promise<Blob>;
		body: ReadableStream;
	}
	interface R2Objects {
		objects: R2Object[];
		truncated: boolean;
		cursor?: string;
	}

	interface Env {
		DB: D1Database;
		FAL_API_KEY: string;
		IMAGES: R2Bucket;
	}

	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
