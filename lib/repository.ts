import { env } from 'cloudflare:workers';
import type { Workspace } from './types';
import { seedWorkspace } from './data';
export interface WorkspaceRepository {
 load(id:string):Promise<{state:Workspace;revision:number}|null>;
 create(id:string):Promise<void>;
 save(id:string,state:Workspace,expectedRevision:number):Promise<boolean>;
}
/** Swap this adapter for PostgreSQL without changing workflow or UI code. */
export class D1WorkspaceRepository implements WorkspaceRepository {
 private db(){if(!env.DB)throw new Error('Workspace storage is unavailable.');return env.DB;}
 async load(id:string){const row=await this.db().prepare('SELECT payload, revision FROM workspaces WHERE id = ?').bind(id).first<{payload:string;revision:number}>();return row?{state:JSON.parse(row.payload) as Workspace,revision:row.revision}:null;}
 async create(id:string){await this.db().prepare('INSERT OR IGNORE INTO workspaces (id, payload, revision, created_at) VALUES (?, ?, 0, ?)').bind(id,JSON.stringify(seedWorkspace()),new Date().toISOString()).run();}
 async save(id:string,state:Workspace,revision:number){const r=await this.db().prepare('UPDATE workspaces SET payload = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(state),id,revision).run();return r.meta.changes===1;}
}
export const repository:WorkspaceRepository = new D1WorkspaceRepository();
