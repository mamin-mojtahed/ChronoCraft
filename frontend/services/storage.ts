import { openDB, DBSchema, IDBPDatabase } from "idb";
import { CachedTimelineRecord } from "@/types/timeline";

interface ChronoCraftDB extends DBSchema {
  timelines: {
    key: string;
    value: CachedTimelineRecord;
    indexes: {
      "by-created": number;
      "by-topic": string;
      "by-favorite": number;
    };
  };
}

const DB_NAME = "chronocraft-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChronoCraftDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ChronoCraftDB>> | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<ChronoCraftDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("timelines")) {
          const store = db.createObjectStore("timelines", { keyPath: "id" });
          store.createIndex("by-created", "createdAt");
          store.createIndex("by-topic", "topic");
          store.createIndex("by-favorite", "isFavorite");
        }
      },
    });
  }
  return dbPromise;
}

export const StorageService = {
  async saveTimeline(record: CachedTimelineRecord): Promise<void> {
    const db = getDb();
    if (!db) return;
    const database = await db;
    await database.put("timelines", record);
  },

  async getTimeline(id: string): Promise<CachedTimelineRecord | undefined> {
    const db = getDb();
    if (!db) return undefined;
    const database = await db;
    return database.get("timelines", id);
  },

  async getAllTimelines(): Promise<CachedTimelineRecord[]> {
    const db = getDb();
    if (!db) return [];
    const database = await db;
    const all = await database.getAllFromIndex("timelines", "by-created");
    // Sort descending by createdAt (most recent first)
    return all.reverse();
  },

  async deleteTimeline(id: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    const database = await db;
    await database.delete("timelines", id);
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    const database = await db;
    const item = await database.get("timelines", id);
    if (!item) return false;
    const updated = { ...item, isFavorite: !item.isFavorite, updatedAt: Date.now() };
    await database.put("timelines", updated);
    return !!updated.isFavorite;
  },

  async clearAllTimelines(): Promise<void> {
    const db = getDb();
    if (!db) return;
    const database = await db;
    await database.clear("timelines");
  },

  async exportAllAsJson(): Promise<string> {
    const timelines = await this.getAllTimelines();
    return JSON.stringify({
      version: "1.0",
      exportedAt: new Date().toISOString(),
      timelines,
    }, null, 2);
  },

  async importFromJson(jsonString: string): Promise<number> {
    const db = getDb();
    if (!db) return 0;
    const parsed = JSON.parse(jsonString);
    const timelines: CachedTimelineRecord[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.timelines)
      ? parsed.timelines
      : [];

    const database = await db;
    const tx = database.transaction("timelines", "readwrite");
    let count = 0;
    for (const item of timelines) {
      if (item && item.id && item.timelineData) {
        await tx.store.put(item);
        count++;
      }
    }
    await tx.done;
    return count;
  },
};
