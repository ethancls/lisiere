import {pgSchema,serial,integer,text,varchar,boolean,timestamp,date,geometry} from 'drizzle-orm/pg-core';
export const clap=pgSchema('bdd_clap');
export const user=clap.table('utilisateurs',{
 id:serial('id_uti').primaryKey(),name:varchar('pseudo',{length:50}).notNull().unique(),
 firstName:varchar('prenom',{length:80}),lastName:varchar('nom',{length:80}),
 email:text('email').notNull().unique(),emailVerified:boolean('email_verifie').notNull().default(false),image:text('avatar'),
 createdAt:timestamp('cree_le',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('modifie_le',{withTimezone:true}).notNull().defaultNow(),
 inscription:date('date_inscrip').defaultNow()
});
export const session=clap.table('lisiere_session',{
 id:text('id').primaryKey(),token:text('token').notNull().unique(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
 ipAddress:text('ip_address'),userAgent:text('user_agent'),userId:integer('user_id').notNull().references(()=>user.id,{onDelete:'cascade'})
});
export const account=clap.table('lisiere_account',{
 id:text('id').primaryKey(),accountId:text('account_id').notNull(),providerId:text('provider_id').notNull(),userId:integer('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
 accessToken:text('access_token'),refreshToken:text('refresh_token'),idToken:text('id_token'),accessTokenExpiresAt:timestamp('access_token_expires_at',{withTimezone:true}),refreshTokenExpiresAt:timestamp('refresh_token_expires_at',{withTimezone:true}),scope:text('scope'),password:text('password_hash'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
});
export const verification=clap.table('lisiere_verification',{
 id:text('id').primaryKey(),identifier:text('identifier').notNull(),value:text('value').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
});
export const departments=clap.table('departement',{id:integer('id_dept').primaryKey(),name:varchar('nom',{length:30}).notNull(),code:varchar('code',{length:3}).notNull()});
export const communes=clap.table('communes',{id:integer('id_commune').primaryKey(),name:varchar('nom_officiel',{length:200}).notNull(),postalCode:varchar('code_postal',{length:5}).notNull(),inseeCode:varchar('code_insee',{length:5}),departmentId:integer('id_dept').notNull()});
export const boites=clap.table('boites',{id:serial('id_boite').primaryKey(),refSource:varchar('ref_source',{length:50}),address:varchar('adresse',{length:120}),communeId:integer('id_commune').notNull(),geom:geometry('geom',{type:'point',srid:2154})});
