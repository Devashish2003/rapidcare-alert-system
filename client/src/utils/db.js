import {openDB} from 'idb';

const DB_NAME = 'rapidcare-offline';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Draft form data for new emergencies
                if (!db.objectStoreNames.contains('emergency_drafts')) {
                    db.createObjectStore('emergency_drafts', {keyPath: 'id'});
                }
                // Voice recording blobs stored while offline
                if (!db.objectStoreNames.contains('voice_blobs')) {
                    db.createObjectStore('voice_blobs', {keyPath: 'id'});
                }
                // Failed POST requests to replay when back online
                if (!db.objectStoreNames.contains('queued_requests')) {
                    const store = db.createObjectStore('queued_requests', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('by_created', 'createdAt');
                }
                // Cached hospital list
                if (!db.objectStoreNames.contains('hospital_cache')) {
                    db.createObjectStore('hospital_cache', {keyPath: 'id'});
                }
            },
        });
    }
    return dbPromise;
}

// ── Emergency draft ──────────────────────────────────────────────────────────

export async function saveDraft(draft) {
    const db = await getDb();
    await db.put('emergency_drafts', {id: 'current', ...draft, savedAt: Date.now()});
}

export async function loadDraft() {
    const db = await getDb();
    return db.get('emergency_drafts', 'current');
}

export async function clearDraft() {
    const db = await getDb();
    await db.delete('emergency_drafts', 'current');
}

// ── Voice blob ───────────────────────────────────────────────────────────────

export async function saveVoiceBlob(blob) {
    const db = await getDb();
    await db.put('voice_blobs', {id: 'current', blob, savedAt: Date.now()});
}

export async function loadVoiceBlob() {
    const db = await getDb();
    const record = await db.get('voice_blobs', 'current');
    return record?.blob || null;
}

export async function clearVoiceBlob() {
    const db = await getDb();
    await db.delete('voice_blobs', 'current');
}

// ── Request queue ────────────────────────────────────────────────────────────

/**
 * Queue a failed request for later replay.
 * @param {object} req - { url, method, data, headers }
 */
export async function enqueueRequest(req) {
    const db = await getDb();
    await db.add('queued_requests', {...req, createdAt: Date.now()});
}

export async function getAllQueuedRequests() {
    const db = await getDb();
    return db.getAllFromIndex('queued_requests', 'by_created');
}

export async function deleteQueuedRequest(id) {
    const db = await getDb();
    await db.delete('queued_requests', id);
}

// ── Hospital cache ───────────────────────────────────────────────────────────

export async function cacheHospitals(hospitals) {
    const db = await getDb();
    const tx = db.transaction('hospital_cache', 'readwrite');
    await tx.store.clear();
    await Promise.all(hospitals.map((h) => tx.store.put(h)));
    await tx.done;
}

export async function getCachedHospitals() {
    const db = await getDb();
    return db.getAll('hospital_cache');
}
