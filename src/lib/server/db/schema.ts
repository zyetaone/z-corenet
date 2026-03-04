import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	title: text('title').notNull().default('Designing Workplaces That Think'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	status: text('status').notNull().default('open')
});

export const sessionFeatures = sqliteTable(
	'session_features',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		sessionId: text('session_id').notNull(),
		featureId: integer('feature_id').notNull(),
		name: text('name').notNull(),
		description: text('description').notNull(),
		category: text('category').notNull(),
		hasEvidence: integer('has_evidence', { mode: 'boolean' }).notNull().default(false),
		level: text('level').notNull().default('neither'),
		caption: text('caption')
	},
	(table) => [
		index('sf_session_idx').on(table.sessionId),
		uniqueIndex('sf_session_feature_idx').on(table.sessionId, table.featureId)
	]
);

export const participants = sqliteTable(
	'participants',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sessionId: text('session_id').notNull(),
		name: text('name'),
		email: text('email'),
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [index('participants_session_idx').on(table.sessionId)]
);

export const votes = sqliteTable(
	'votes',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		participantId: text('participant_id').notNull(),
		sessionId: text('session_id').notNull(),
		phase: text('phase').notNull(),
		featureId: integer('feature_id').notNull()
	},
	(table) => [
		index('votes_session_idx').on(table.sessionId),
		uniqueIndex('votes_unique_idx').on(table.participantId, table.phase, table.featureId)
	]
);

export const comments = sqliteTable(
	'comments',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		participantId: text('participant_id').notNull(),
		sessionId: text('session_id').notNull(),
		text: text('text').notNull()
	},
	(table) => [index('comments_session_idx').on(table.sessionId)]
);

export const workspaceImages = sqliteTable(
	'workspace_images',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sessionId: text('session_id').notNull(),
		participantId: text('participant_id'),
		participantName: text('participant_name'),
		participantEmail: text('participant_email'),
		imageData: text('image_data').notNull(),
		prompt: text('prompt').notNull(),
		generationNum: integer('generation_num').notNull().default(1),
		type: text('type').notNull().default('individual'),
		featureNames: text('feature_names'),
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [
		index('idx_wi_session').on(table.sessionId),
		index('idx_wi_participant').on(table.participantId)
	]
);

export type Session = typeof sessions.$inferSelect;
export type SessionFeature = typeof sessionFeatures.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type WorkspaceImage = typeof workspaceImages.$inferSelect;
