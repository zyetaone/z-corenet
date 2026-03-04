export function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}
