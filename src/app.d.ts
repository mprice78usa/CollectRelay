declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				workspaceId: string;
			} | null;
			clientSession: {
				transactionId: string;
				clientEmail: string;
				clientName: string;
				token: string;
			} | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				FILES_BUCKET: R2Bucket;
				SESSIONS: KVNamespace;
				MAGIC_LINKS: KVNamespace;
				EMAIL_API_KEY: string;
				EMAIL_FROM: string;
				APP_URL: string;
				STRIPE_SECRET_KEY: string;
				STRIPE_PUBLISHABLE_KEY: string;
				STRIPE_WEBHOOK_SECRET: string;
				ADMIN_EMAILS: string;
				TWILIO_ACCOUNT_SID: string;
				TWILIO_AUTH_TOKEN: string;
				TWILIO_PHONE_NUMBER: string;
				AI: Ai;
			};
			context?: ExecutionContext;
		}
	}
}

export {};
