import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	updateTeamSeats,
	getTeamSeatCount,
	TEAM_INCLUDED_SEATS,
	TEAM_SEAT_PRICE_MONTHLY,
	TEAM_SEAT_PRICE_ANNUAL
} from '$lib/server/stripe';

/** GET /api/stripe/seats — Get current seat info for the workspace */
export const GET: RequestHandler = async ({ platform, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const db = platform?.env?.DB;
	const stripeKey = platform?.env?.STRIPE_SECRET_KEY;
	if (!db || !stripeKey) throw error(503, 'Service not available');

	const workspace = await db
		.prepare('SELECT plan_key, stripe_subscription_id, max_users FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ plan_key: string; stripe_subscription_id: string | null; max_users: number }>();

	if (!workspace || workspace.plan_key !== 'team') {
		return json({
			plan: workspace?.plan_key || 'free',
			includedSeats: workspace?.plan_key === 'pro' ? 1 : workspace?.plan_key === 'free' ? 1 : TEAM_INCLUDED_SEATS,
			extraSeats: 0,
			totalSeats: workspace?.max_users || 1,
			canAddSeats: false,
			seatPriceMonthly: TEAM_SEAT_PRICE_MONTHLY,
			seatPriceAnnual: TEAM_SEAT_PRICE_ANNUAL
		});
	}

	if (!workspace.stripe_subscription_id) {
		return json({
			plan: 'team',
			includedSeats: TEAM_INCLUDED_SEATS,
			extraSeats: 0,
			totalSeats: TEAM_INCLUDED_SEATS,
			canAddSeats: false,
			seatPriceMonthly: TEAM_SEAT_PRICE_MONTHLY,
			seatPriceAnnual: TEAM_SEAT_PRICE_ANNUAL
		});
	}

	const seatInfo = await getTeamSeatCount(stripeKey, workspace.stripe_subscription_id);

	return json({
		plan: 'team',
		includedSeats: TEAM_INCLUDED_SEATS,
		extraSeats: seatInfo.extraSeats,
		totalSeats: seatInfo.totalSeats,
		canAddSeats: true,
		seatPriceMonthly: TEAM_SEAT_PRICE_MONTHLY,
		seatPriceAnnual: TEAM_SEAT_PRICE_ANNUAL,
		extraMonthlyCost: seatInfo.monthlyCost
	});
};

/** POST /api/stripe/seats — Add or remove extra seats */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	// Only workspace owners/admins can change seats
	if (user.role !== 'owner' && user.role !== 'admin') {
		throw error(403, 'Only workspace owners and admins can manage seats');
	}

	const db = platform?.env?.DB;
	const stripeKey = platform?.env?.STRIPE_SECRET_KEY;
	if (!db || !stripeKey) throw error(503, 'Service not available');

	const body = await request.json();
	const extraSeats = Math.max(0, Math.floor(Number(body.extraSeats) || 0));

	if (extraSeats > 95) {
		throw error(400, 'Maximum 100 total team members (contact us for Enterprise)');
	}

	const workspace = await db
		.prepare('SELECT plan_key, stripe_subscription_id FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ plan_key: string; stripe_subscription_id: string | null }>();

	if (!workspace || workspace.plan_key !== 'team') {
		throw error(400, 'Additional seats are only available on the Team plan');
	}

	if (!workspace.stripe_subscription_id) {
		throw error(400, 'No active subscription found');
	}

	const result = await updateTeamSeats(stripeKey, workspace.stripe_subscription_id, extraSeats);

	// Update workspace max_users in DB
	await db
		.prepare('UPDATE workspaces SET max_users = ? WHERE id = ?')
		.bind(result.totalSeats, user.workspaceId)
		.run();

	return json({
		success: true,
		totalSeats: result.totalSeats,
		extraSeats: result.extraSeats,
		includedSeats: TEAM_INCLUDED_SEATS
	});
};
