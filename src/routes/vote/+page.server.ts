import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import {
	getSessionById,
	getSessionFeatures,
	getLatestOpenSession,
	createSession,
	copyDefaultFeatures,
	createParticipant,
	saveVotes,
	saveComment
} from '$lib/server/db/queries';
import { votes, participants } from '$lib/server/db/schema';
import { MAX_PICKS, DEFAULT_FEATURES } from '$lib/data/default-features';
import { generateCode } from '$lib/server/utils';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const db = getDb(platform);

	let participantId = cookies.get('participant_id');
	let sessionId = cookies.get('session_id');

	// Resolve a valid open session — self-heal if cookies are stale or missing
	let session = sessionId ? await getSessionById(db, sessionId) : null;

	if (!session || session.status !== 'open') {
		// Stale or missing session — find or create an open one and register a new participant
		session = await getLatestOpenSession(db);
		if (!session) {
			const code = generateCode();
			session = await createSession(db, code, 'Designing Workplaces That Think');
			await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);
		}

		const participant = await createParticipant(db, session.id);
		participantId = participant.id;
		sessionId = session.id;

		cookies.set('participant_id', participantId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});
		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});
		cookies.set('user_name', '', { path: '/', maxAge: 0, httpOnly: false });
		cookies.set('user_email', '', { path: '/', maxAge: 0, httpOnly: false });
	} else if (participantId) {
		// Session is valid+open — verify participant belongs to this session
		const [p] = await db
			.select({ id: participants.id })
			.from(participants)
			.where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
			.limit(1);

		if (!p) {
			const participant = await createParticipant(db, session.id);
			participantId = participant.id;
			sessionId = session.id;
			cookies.set('participant_id', participantId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24
			});
			cookies.set('session_id', sessionId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24
			});
		}
	}

	if (!participantId || !sessionId) {
		redirect(303, '/');
	}

	const features = await getSessionFeatures(db, session.id);

	const existingVotes = await db
		.select({ id: votes.id })
		.from(votes)
		.where(and(eq(votes.participantId, participantId), eq(votes.sessionId, sessionId)))
		.limit(1);

	if (existingVotes.length > 0) {
		redirect(303, '/thanks');
	}

	return { participantId, session, features };
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const participantId = cookies.get('participant_id');
		const sessionId = cookies.get('session_id');
		if (!participantId || !sessionId) {
			redirect(303, '/');
		}

		const formData = await request.formData();
		const individualIds = formData
			.getAll('individualIds')
			.map((id) => Number(id))
			.filter((id) => !isNaN(id));
		const communalIds = formData
			.getAll('communalIds')
			.map((id) => Number(id))
			.filter((id) => !isNaN(id));

		if (individualIds.length === 0 || communalIds.length === 0) {
			return fail(400, { error: 'Invalid vote data (missing selections)' });
		}

		if (individualIds.length > MAX_PICKS || communalIds.length > MAX_PICKS) {
			return fail(400, { error: 'Too many picks' });
		}

		const comment = (formData.get('comment') as string)?.trim() || '';

		const db = getDb(platform);

		// 防呆 check: already voted?
		const existingVotes = await db
			.select({ id: votes.id })
			.from(votes)
			.where(and(eq(votes.participantId, participantId), eq(votes.sessionId, sessionId)))
			.limit(1);

		if (existingVotes.length > 0) {
			redirect(303, '/thanks');
		}

		await saveVotes(db, participantId, sessionId, 'individual', individualIds);
		await saveVotes(db, participantId, sessionId, 'communal', communalIds);

		if (comment) {
			await saveComment(db, participantId, sessionId, comment);
		}

		redirect(303, '/thanks');
	}
};
