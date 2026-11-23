import {eq} from 'drizzle-orm';
import type {Coordinates} from '#lib/types/boxes.ts';
import {communeCode} from '../commune-boundary';
import {postgres} from './index';
import {communes,departments} from './schema';

export async function boxCommune(position:Coordinates){
 const code=await communeCode(position);
 if(!code)return null;
 const matches=await postgres.select({id:communes.id,name:communes.name,postalCode:communes.postalCode,inseeCode:communes.inseeCode,department:departments.name,departmentCode:departments.code})
  .from(communes).leftJoin(departments,eq(communes.departmentId,departments.id)).where(eq(communes.inseeCode,code)).limit(2);
 return matches.length===1?matches[0]:null;
}
