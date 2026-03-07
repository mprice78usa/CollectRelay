/** Core application types */

export interface User {
	id: string;
	email: string;
	name: string;
	company: string | null;
	phone: string | null;
	avatarUrl: string | null;
}

export interface Workspace {
	id: string;
	name: string;
	role: string;
}

export interface SessionUser {
	id: string;
	email: string;
	name: string;
	workspaceId: string;
}

export type TransactionStatus = 'draft' | 'active' | 'in_review' | 'completed' | 'cancelled';
export type ChecklistItemStatus = 'pending' | 'submitted' | 'accepted' | 'rejected' | 'waived';
export type ChecklistItemType = 'document' | 'question' | 'checkbox' | 'signature';
export type TemplateCategory = 'pre-approval' | 'purchase' | 'refinance' | 'seller' | 'custom';
