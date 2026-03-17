/** IndexedDB schema and access for offline sync queue */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'collectrelay-offline';
const DB_VERSION = 1;

export interface SyncQueueItem {
	id?: number;
	type: 'photo' | 'voice' | 'text';
	transactionId: string;
	payload: Record<string, any>;
	fileData?: ArrayBuffer;
	fileName?: string;
	mimeType?: string;
	createdAt: number;
	retryCount: number;
	status: 'pending' | 'syncing' | 'failed';
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains('sync-queue')) {
				const store = db.createObjectStore('sync-queue', {
					keyPath: 'id',
					autoIncrement: true
				});
				store.createIndex('type', 'type');
				store.createIndex('createdAt', 'createdAt');
				store.createIndex('status', 'status');
			}
			if (!db.objectStoreNames.contains('app-state')) {
				db.createObjectStore('app-state');
			}
		}
	});

	return dbInstance;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
	const db = await getDB();
	return await db.add('sync-queue', item) as number;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
	const db = await getDB();
	return await db.getAll('sync-queue');
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
	const db = await getDB();
	const all = await db.getAll('sync-queue');
	return all.filter(item => item.status === 'pending' || item.status === 'failed');
}

export async function updateSyncItem(id: number, updates: Partial<SyncQueueItem>): Promise<void> {
	const db = await getDB();
	const item = await db.get('sync-queue', id);
	if (item) {
		Object.assign(item, updates);
		await db.put('sync-queue', item);
	}
}

export async function removeSyncItem(id: number): Promise<void> {
	const db = await getDB();
	await db.delete('sync-queue', id);
}

export async function getSyncQueueCount(): Promise<number> {
	const db = await getDB();
	const all = await db.getAll('sync-queue');
	return all.filter(item => item.status !== 'syncing').length;
}

export async function getClientId(): Promise<string> {
	const db = await getDB();
	let clientId = await db.get('app-state', 'clientId');
	if (!clientId) {
		clientId = crypto.randomUUID();
		await db.put('app-state', clientId, 'clientId');
	}
	return clientId;
}

export async function clearSyncQueue(): Promise<void> {
	const db = await getDB();
	await db.clear('sync-queue');
}
