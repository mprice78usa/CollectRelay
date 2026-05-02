/** Shared types for cloud storage provider integrations (Box, Dropbox, Drive). */

export type CloudProviderKey = 'box' | 'dropbox' | 'gdrive';

export interface CloudConnection {
	id: string;
	workspace_id: string;
	provider: CloudProviderKey;
	external_user_id: string;
	external_account_email: string | null;
	access_token: string;
	refresh_token: string | null;
	token_expires_at: string | null;
	default_folder_id: string | null;
	default_folder_name: string | null;
	connected_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface OAuthAuthorizeUrl {
	url: string;
	state: string;
}

export interface OAuthTokens {
	accessToken: string;
	refreshToken: string | null;
	expiresAt: string | null;
	externalUserId: string;
	externalAccountEmail: string | null;
}

export interface CloudUploadResult {
	externalFileId: string;
	externalPath: string;
}

export interface CloudFolder {
	id: string;
	name: string;
}

export interface CloudProvider {
	key: CloudProviderKey;
	displayName: string;

	isConfigured(env: App.Platform['env']): boolean;

	buildAuthorizeUrl(
		env: App.Platform['env'],
		state: string,
		redirectUri: string
	): string;

	exchangeCode(
		env: App.Platform['env'],
		code: string,
		redirectUri: string
	): Promise<OAuthTokens>;

	refreshToken(
		env: App.Platform['env'],
		refreshToken: string
	): Promise<OAuthTokens>;

	getOrCreateFolder(
		accessToken: string,
		path: string[]
	): Promise<CloudFolder>;

	uploadFile(
		accessToken: string,
		folderId: string,
		filename: string,
		bytes: Uint8Array,
		mimeType: string | null
	): Promise<CloudUploadResult>;

	revoke?(env: App.Platform['env'], accessToken: string): Promise<void>;
}
