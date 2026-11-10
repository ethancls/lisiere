import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { POSTGRES_URL,POSTGRES_CA_FILE,POSTGRES_TLS_SERVERNAME } from '$app/env/private';
import { postgresConfig } from '../../../../scripts/pg-config';
import * as schema from './schema';
export const pool=new Pool(postgresConfig({POSTGRES_URL,POSTGRES_CA_FILE,POSTGRES_TLS_SERVERNAME}));
pool.on('error',()=>console.error('PostgreSQL pool connection error'));
export const postgres=drizzle(pool,{schema});
