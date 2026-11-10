import { readFileSync } from 'node:fs';
import { checkServerIdentity } from 'node:tls';
export function postgresConfig(env: Record<string,string|undefined>) {
 if(!env.POSTGRES_URL || !env.POSTGRES_CA_FILE || !env.POSTGRES_TLS_SERVERNAME) throw new Error('PostgreSQL TLS configuration is missing');
 return {connectionString:env.POSTGRES_URL,connectionTimeoutMillis:10000,max:5,
  ssl:{rejectUnauthorized:true,ca:readFileSync(env.POSTGRES_CA_FILE,'utf8'),checkServerIdentity:(_host:string,cert:Parameters<typeof checkServerIdentity>[1])=>checkServerIdentity(env.POSTGRES_TLS_SERVERNAME!,cert)}};
}
