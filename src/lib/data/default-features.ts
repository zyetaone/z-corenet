/** Maximum number of feature picks per voting phase */
export const MAX_PICKS = 5;

export const FEATURE_GROUPS = [
	{ key: 'light', label: 'Light & Daylight' },
	{ key: 'air', label: 'Air & Thermal' },
	{ key: 'acoustic', label: 'Acoustic' },
	{ key: 'biophilic', label: 'Biophilic & Nature' },
	{ key: 'wellness', label: 'Movement & Wellness' },
	{ key: 'tech', label: 'Technology' },
	{ key: 'social', label: 'Social & Spatial' },
	{ key: 'furniture', label: 'Furniture & Aesthetics' }
] as const;

export type GroupKey = (typeof FEATURE_GROUPS)[number]['key'];

/** Short labels for radar chart axes — one per FEATURE_GROUPS entry, same order. */
export const RADAR_LABELS = [
	'Light',
	'Air',
	'Sound',
	'Nature',
	'Health',
	'Tech',
	'Social',
	'Design'
];

/** Maps raw category values to display group keys */
export const CATEGORY_TO_GROUP: Record<string, GroupKey> = {
	light: 'light',
	air: 'air',
	thermal: 'air',
	acoustic: 'acoustic',
	biophilic: 'biophilic',
	wellness: 'wellness',
	movement: 'wellness',
	tech: 'tech',
	operational: 'tech',
	social: 'social',
	spatial: 'social',
	furniture: 'furniture',
	aesthetic: 'furniture'
};

export interface DefaultFeature {
	featureId: number;
	name: string;
	description: string;
	category: string;
	group: GroupKey;
	hasEvidence: boolean;
	level: 'individual' | 'communal' | 'neither';
	caption: string | null;
}

export const DEFAULT_FEATURES: DefaultFeature[] = [
	{
		featureId: 1,
		name: 'Tuneable LED lighting with circadian profiles',
		description:
			'Lighting that adjusts colour temperature throughout the day to support natural alertness cycles',
		category: 'light',
		group: 'light',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Circadian-tuned light regulates alertness hormones and supports sustained focus — AWA/CEBMa body budget research'
	},
	{
		featureId: 2,
		name: 'Real-time desk-level environmental sensors',
		description: 'CO₂, temperature, humidity and noise sensors at individual workstation level',
		category: 'tech',
		group: 'tech',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Real-time data enables informed choice — people select conditions matching their cognitive needs (AWA Choice Principle)'
	},
	{
		featureId: 3,
		name: 'Dedicated quiet zones with acoustic treatment',
		description: 'Sound-absorbing materials, acoustic panels, and designated silent working areas',
		category: 'acoustic',
		group: 'acoustic',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Noise is the #1 cognitive depleter — acoustic control protects deep focus and working memory (CEBMa systematic review)'
	},
	{
		featureId: 4,
		name: 'Biophilic design elements',
		description: 'Living walls, indoor plants, natural timber, stone and water features throughout',
		category: 'biophilic',
		group: 'biophilic',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Nature elements reduce cortisol, restore directed attention and boost creativity by up to 15% (Human Spaces / CEBMa)'
	},
	{
		featureId: 5,
		name: 'Distributed hydration points',
		description: 'Filtered water stations placed throughout the floor, not just in kitchens',
		category: 'wellness',
		group: 'wellness',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Even 2% dehydration impairs cognitive function by up to 30% — proximity removes friction (Ritz & Berrut / CEBMa review)'
	},
	{
		featureId: 6,
		name: 'Team anchor points',
		description: 'Dedicated home zones where teams have a sense of belonging and territory',
		category: 'social',
		group: 'social',
		hasEvidence: true,
		level: 'communal',
		caption:
			"Dedicated team zones build trust and social cohesion — two of AWA's 6 Factors of Connected Teams"
	},
	{
		featureId: 7,
		name: 'Variety of thermal zones',
		description: 'Deliberately varied temperature areas — warmer and cooler zones across the floor',
		category: 'thermal',
		group: 'air',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Individual thermal sensitivity varies enormously — one temperature is cognitively wrong for many (AWA/CEBMa research)'
	},
	{
		featureId: 8,
		name: 'High-quality ventilation with CO₂ monitoring',
		description: 'HVAC maintaining CO₂ below 800ppm with real-time monitoring and alerts',
		category: 'air',
		group: 'air',
		hasEvidence: true,
		level: 'individual',
		caption:
			'CO₂ above 1000ppm measurably impairs decision-making and strategy (Harvard COGfx / CEBMa systematic review)'
	},
	{
		featureId: 9,
		name: 'Internal staircase connecting floors',
		description: 'Visible, attractive open staircase encouraging movement between floors',
		category: 'movement',
		group: 'wellness',
		hasEvidence: true,
		level: 'communal',
		caption:
			'Stairs promote movement (+30% executive function) and create spontaneous cross-team encounters (AWA 6 Factors)'
	},
	{
		featureId: 10,
		name: 'Café / social hub on high-footfall route',
		description: 'Central social space positioned where natural movement patterns intersect',
		category: 'social',
		group: 'social',
		hasEvidence: true,
		level: 'communal',
		caption:
			'Social hubs on natural routes engineer productive collisions that build communal trust (AWA 6 Factors research)'
	},
	{
		featureId: 11,
		name: 'Restoration / decompression spaces',
		description: 'Genuine restorative areas with soft lighting, biophilic elements, no screens',
		category: 'wellness',
		group: 'wellness',
		hasEvidence: true,
		level: 'individual',
		caption:
			'The brain needs periodic restoration to maintain the body budget — a cognitive necessity (Barrett / AWA research)'
	},
	{
		featureId: 12,
		name: 'Healthy food provision',
		description: 'Fresh, nutritious food options beyond vending machines and processed snacks',
		category: 'wellness',
		group: 'wellness',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Diet directly affects neurotransmitter production — nutritious food sustains mental performance (CEBMa 13 Factors)'
	},
	{
		featureId: 13,
		name: 'Variety of space types for different tasks',
		description: 'Focus booths, collaboration zones, creative spaces, social areas — true ABW',
		category: 'spatial',
		group: 'social',
		hasEvidence: true,
		level: 'communal',
		caption:
			'Different cognitive tasks need different environments — variety supports both focus and collaboration (AWA/CEBMa)'
	},
	{
		featureId: 14,
		name: 'Maximised natural daylight',
		description:
			'Floor layouts designed to bring daylight deep into the floorplate for all workers',
		category: 'light',
		group: 'light',
		hasEvidence: true,
		level: 'individual',
		caption:
			'#1 worker priority; directly supports circadian rhythm, sleep quality and alertness (CEBMa systematic review)'
	},
	{
		featureId: 15,
		name: 'Outdoor access / terrace / garden',
		description: 'Direct access to outdoor spaces for breaks, walking meetings, restoration',
		category: 'biophilic',
		group: 'biophilic',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Nature exposure restores directed attention and improves working memory by 7% (Berman et al. / CEBMa review)'
	},
	{
		featureId: 16,
		name: 'Exercise facilities on the working floor',
		description: 'Gym equipment, stretching areas or movement zones integrated into the work floor',
		category: 'movement',
		group: 'wellness',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Exercise increases BDNF and cerebral blood flow, boosting executive function by up to 30% (Kramer / CEBMa review)'
	},
	{
		featureId: 17,
		name: 'Screens / apps showing space conditions',
		description:
			'Displays showing real-time temperature, humidity, noise and availability of each zone',
		category: 'tech',
		group: 'tech',
		hasEvidence: true,
		level: 'individual',
		caption:
			'Informed choice turns environmental variety into cognitive advantage — people need data to choose well (AWA research)'
	},
	{
		featureId: 18,
		name: 'Branded feature wall in reception',
		description: 'High-impact branded installation showcasing company identity and values',
		category: 'aesthetic',
		group: 'furniture',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 19,
		name: 'Sit-stand desks',
		description:
			'Height-adjustable desks allowing workers to alternate between sitting and standing',
		category: 'furniture',
		group: 'furniture',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 20,
		name: 'Premium ergonomic task chairs',
		description: 'High-end ergonomic seating (e.g. Herman Miller, Steelcase Gesture)',
		category: 'furniture',
		group: 'furniture',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 21,
		name: 'Workplace booking app',
		description: 'Digital system for reserving desks, meeting rooms and collaboration spaces',
		category: 'tech',
		group: 'tech',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 22,
		name: 'Large video wall showing company news',
		description: 'Reception or communal area screen displaying company updates and metrics',
		category: 'aesthetic',
		group: 'furniture',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 23,
		name: 'Ping pong / foosball table',
		description: 'Games tables in breakout areas for informal recreation',
		category: 'social',
		group: 'social',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 24,
		name: 'Shower facilities',
		description: 'On-site showers supporting active commuting and lunchtime exercise',
		category: 'wellness',
		group: 'wellness',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 25,
		name: 'Wellness app subscription',
		description: 'Company-provided meditation, fitness tracking and wellbeing app access',
		category: 'tech',
		group: 'tech',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 26,
		name: 'Phone booths for private calls',
		description: 'Small enclosed pods for confidential or focused telephone conversations',
		category: 'acoustic',
		group: 'acoustic',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 27,
		name: 'Designer furniture and high-end finishes',
		description: 'Premium materials, designer pieces and luxury aesthetic throughout',
		category: 'aesthetic',
		group: 'furniture',
		hasEvidence: false,
		level: 'neither',
		caption: null
	},
	{
		featureId: 28,
		name: 'Easy-to-access helpdesk',
		description: 'Visible, staffed facilities helpdesk for immediate issue resolution',
		category: 'operational',
		group: 'tech',
		hasEvidence: false,
		level: 'neither',
		caption: null
	}
];
