import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private db!: Database.Database;

  onModuleInit() {
    const dbPath =
      process.env.NODE_ENV === 'test'
        ? ':memory:'
        : path.resolve(process.cwd(), 'data', 'timeoff.db');

    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
    this.logger.log(`Database initialized at ${dbPath}`);
  }

  private runMigrations(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS balances (
        id          TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL UNIQUE,
        days_total  REAL NOT NULL DEFAULT 0,
        days_used   REAL NOT NULL DEFAULT 0,
        days_pending REAL NOT NULL DEFAULT 0,
        year        INTEGER NOT NULL,
        source      TEXT NOT NULL DEFAULT 'hcm',
        last_synced_at TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS time_off_requests (
        id          TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        type        TEXT NOT NULL CHECK(type IN ('vacation','sick','personal','other')),
        status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
        start_date  TEXT NOT NULL,
        end_date    TEXT NOT NULL,
        days_requested REAL NOT NULL,
        reason      TEXT,
        manager_id  TEXT,
        reviewed_at TEXT,
        review_note TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES balances(employee_id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS sync_logs (
        id          TEXT PRIMARY KEY,
        started_at  TEXT NOT NULL,
        finished_at TEXT,
        status      TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','failed')),
        records_synced INTEGER DEFAULT 0,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_requests_employee ON time_off_requests(employee_id);
      CREATE INDEX IF NOT EXISTS idx_requests_status   ON time_off_requests(status);
      CREATE INDEX IF NOT EXISTS idx_requests_dates    ON time_off_requests(start_date, end_date);
    `);
  }

  prepare<T = unknown>(sql: string): Database.Statement<T[]> {
    return this.db.prepare(sql) as Database.Statement<T[]>;
  }

  run(sql: string, params: unknown[] = []): Database.RunResult {
    return this.db.prepare(sql).run(params);
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(params) as T | undefined;
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(params) as T[];
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  close(): void {
    if (this.db?.open) {
      this.db.close();
    }
  }
}