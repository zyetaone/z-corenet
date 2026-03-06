import type { TallyResult } from '$lib/server/tally';
import type { RadarDataset, CategoryStat } from '$lib/types/dashboard';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP, RADAR_LABELS } from '$lib/data/default-features';
import type { GroupKey } from '$lib/data/default-features';

export { RADAR_LABELS };

export class DashboardState {
	static readonly TOTAL_PAGES = 4;

	#getData: () => TallyResult = null!;
	polledResults = $state.raw<TallyResult | null>(null);
	justUpdated = $state(false);
	polling = $state(false);
	showResults = $state(false);
	page = $state(1);
	direction = $state<'forward' | 'backward'>('forward');

	workspaceImages = $state.raw<{
		individual: Array<{
			id: string;
			participantName: string;
			imageData: string;
			featureNames: string[];
			prompt: string;
			createdAt: string;
		}>;
		collective: Array<{
			id: string;
			imageData: string;
			prompt: string;
			featureNames: string[];
			createdAt: string;
		}>;
	}>({ individual: [], collective: [] });

	collectiveImage = $state<string | null>(null);
	collectivePrompt = $state<string>('');
	collectiveGenerationsRemaining = $state(10);

	constructor(getData: () => TallyResult) {
		this.#getData = getData;
	}

	nextPage() {
		if (this.page < DashboardState.TOTAL_PAGES) {
			this.direction = 'forward';
			this.page++;
		}
	}

	prevPage() {
		if (this.page > 1) {
			this.direction = 'backward';
			this.page--;
		}
	}

	readonly results = $derived(this.polledResults ?? this.#getData());
	readonly baseUrl = $derived(typeof window !== 'undefined' ? window.location.origin : '');

	// Merge both phases into one sorted list
	readonly combinedFeatures = $derived.by(() => {
		const map = new Map<
			string,
			{
				name: string;
				category: string;
				group: string;
				hasEvidence: boolean;
				caption: string | null;
				voteCount: number;
			}
		>();
		for (const f of [...this.results.individual.features, ...this.results.communal.features]) {
			const key = `${f.group}::${f.name}`;
			const existing = map.get(key);
			if (existing) {
				existing.voteCount += f.voteCount;
			} else {
				map.set(key, { ...f });
			}
		}
		const merged = [...map.values()].sort((a, b) => {
			if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
			return (b.hasEvidence ? 1 : 0) - (a.hasEvidence ? 1 : 0);
		});
		const totalParticipants = this.results.participantCount;
		return merged.map((f) => ({
			...f,
			percentage: totalParticipants > 0 ? Math.min(100, Math.round((f.voteCount / totalParticipants) * 100)) : 0
		}));
	});

	readonly overallEvidenceRatio = $derived.by(() => {
		const evidencePicks =
			this.results.individual.evidencePicks + this.results.communal.evidencePicks;
		const totalPicks = this.results.individual.totalPicks + this.results.communal.totalPicks;
		return totalPicks > 0 ? Math.round((evidencePicks / totalPicks) * 100) : 0;
	});

	readonly allFeatures = $derived([
		...this.results.individual.features,
		...this.results.communal.features
	]);

	readonly radarDatasets = $derived.by((): RadarDataset[] => {
		const indGroup = new Map<string, number>();
		const commGroup = new Map<string, number>();

		for (const f of this.results.individual.features) {
			const key = (CATEGORY_TO_GROUP[f.group] ?? f.group) as string;
			indGroup.set(key, (indGroup.get(key) ?? 0) + f.voteCount);
		}
		for (const f of this.results.communal.features) {
			const key = (CATEGORY_TO_GROUP[f.group] ?? f.group) as string;
			commGroup.set(key, (commGroup.get(key) ?? 0) + f.voteCount);
		}

		const keys = FEATURE_GROUPS.map((fg) => fg.key);
		const maxVal = Math.max(
			...keys.map((k) => Math.max(indGroup.get(k) ?? 0, commGroup.get(k) ?? 0)),
			1
		);

		return [
			{
				label: 'Individual',
				values: keys.map((k) => Math.round(((indGroup.get(k) ?? 0) / maxVal) * 100)),
				color: 'var(--color-green)',
				fillOpacity: 0.2
			},
			{
				label: 'Communal',
				values: keys.map((k) => Math.round(((commGroup.get(k) ?? 0) / maxVal) * 100)),
				color: 'var(--color-indigo-text)',
				fillOpacity: 0.15
			}
		];
	});

	handleShowResults() {
		this.showResults = true;
		this.page = 1;
		this.direction = 'forward';
	}

	async handleReset(pin: string): Promise<string | null> {
		try {
			const res = await fetch('/api/reset', {
				method: 'POST',
				headers: { 'x-admin-pin': pin }
			});
			if (res.ok) {
				window.location.reload();
				return null;
			}
			const body = await res.json().catch(() => ({}));
			return body.error || `Reset failed (${res.status})`;
		} catch (e) {
			return `Network error: ${e instanceof Error ? e.message : 'unknown'}`;
		}
	}

	async poll() {
		try {
			this.polling = true;
			const res = await fetch('/api/votes');
			if (res.ok) {
				this.polledResults = await res.json();
				this.justUpdated = true;
				setTimeout(() => (this.justUpdated = false), 600);
			}
		} catch {
			// silently ignore polling errors
		} finally {
			this.polling = false;
		}
	}

	async pollWorkspaceImages() {
		try {
			const res = await fetch('/api/workspace-images?all=1');
			if (res.ok) {
				this.workspaceImages = await res.json();
				// Update collective state from latest
				const latest = this.workspaceImages.collective[0];
				if (latest) {
					this.collectiveImage = latest.imageData;
					this.collectivePrompt = latest.prompt;
					this.collectiveGenerationsRemaining = 10 - this.workspaceImages.collective.length;
				}
			}
		} catch {
			// silently ignore
		}
	}

	// ── Extended dashboard state ──

	readonly categoryStats = $derived.by((): CategoryStat[] => {
		const grouped = new Map<
			GroupKey,
			{ totalVotes: number; evidenceVotes: number; evidenceCount: number; featureCount: number }
		>();
		for (const f of this.combinedFeatures) {
			const groupKey = (CATEGORY_TO_GROUP[f.group] ?? f.group) as GroupKey;
			const existing = grouped.get(groupKey);
			if (existing) {
				existing.totalVotes += f.voteCount;
				existing.featureCount++;
				if (f.hasEvidence) {
					existing.evidenceCount++;
					existing.evidenceVotes += f.voteCount;
				}
			} else {
				grouped.set(groupKey, {
					totalVotes: f.voteCount,
					featureCount: 1,
					evidenceCount: f.hasEvidence ? 1 : 0,
					evidenceVotes: f.hasEvidence ? f.voteCount : 0
				});
			}
		}

		const totalVotesAll = [...grouped.values()].reduce((s, g) => s + g.totalVotes, 0);

		return FEATURE_GROUPS.map((fg) => {
			const g = grouped.get(fg.key) ?? { totalVotes: 0, evidenceVotes: 0, evidenceCount: 0, featureCount: 0 };
			return {
				key: fg.key,
				label: fg.label,
				totalVotes: g.totalVotes,
				percentage: totalVotesAll > 0 ? Math.round((g.totalVotes / totalVotesAll) * 100) : 0,
				evidenceCount: g.evidenceCount,
				featureCount: g.featureCount,
				evidenceVotes: g.evidenceVotes,
				evidenceRatio: g.totalVotes > 0 ? Math.round((g.evidenceVotes / g.totalVotes) * 100) : 0
			};
		})
			.filter((c) => c.featureCount > 0)
			.sort((a, b) => b.evidenceRatio - a.evidenceRatio || b.totalVotes - a.totalVotes);
	});

	readonly evidenceSegments = $derived.by(() => {
		const evidenceVotes =
			this.results.individual.evidencePicks + this.results.communal.evidencePicks;
		const totalVotes = this.results.individual.totalPicks + this.results.communal.totalPicks;
		const nonEvidence = totalVotes - evidenceVotes;
		return [
			{ value: evidenceVotes, color: 'var(--color-green)', label: 'Evidence-backed' },
			{ value: Math.max(nonEvidence, 0), color: '#1a2b3c20', label: 'Not evidence-backed' }
		];
	});

	readonly topOverallFeature = $derived(
		this.combinedFeatures.length > 0 ? this.combinedFeatures[0] : null
	);

	readonly topCategory = $derived(this.categoryStats.length > 0 ? this.categoryStats[0] : null);

	readonly consensusAlignment = $derived.by(() => {
		if (this.results.individual.totalPicks === 0 || this.results.communal.totalPicks === 0)
			return 0;
		const topInd = this.results.individual.features.slice(0, 5).map((f) => f.name);
		const topCom = this.results.communal.features.slice(0, 5).map((f) => f.name);
		const shared = topInd.filter((name) => topCom.includes(name));
		const denom = Math.min(5, topInd.length, topCom.length);
		return denom > 0 ? Math.round((shared.length / denom) * 100) : 0;
	});
}
