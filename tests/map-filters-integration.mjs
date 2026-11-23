import assert from 'node:assert/strict';
import {randomInt,randomUUID} from 'node:crypto';
import pg from 'pg';
import {postgresConfig} from '../scripts/pg-config.ts';

const base=new URL(process.env.ORIGIN);
const database=new URL(process.env.POSTGRES_URL);
assert.equal(base.hostname,'127.0.0.1');
assert.equal(database.hostname,'127.0.0.1');
assert.equal(database.pathname,'/clap_books_test');

const client=new pg.Client(postgresConfig(process.env));
await client.connect();
try{
 const suffix=randomUUID().slice(0,8),department=randomInt(1000,1000000),commune=department;
 const auth=await fetch(new URL('/api/auth/sign-up/email',base),{
  method:'POST',headers:{'Content-Type':'application/json',Origin:base.origin},
  body:JSON.stringify({name:'Lecteur '+suffix,email:suffix+'@example.test',password:randomUUID()})
 });
 assert.equal(auth.status,200);
 const cookie=auth.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
 assert.ok(cookie);

 await client.query("INSERT INTO bdd_clap.departement VALUES ($1,'Rhône','69')",[department]);
 await client.query("INSERT INTO bdd_clap.communes VALUES ($1,'Lyon','69002','69123',$2)",[commune,department]);
 const {rows}=await client.query(`
  INSERT INTO bdd_clap.boites (ref_source,adresse,id_commune,geom)
  SELECT label,'Rue de la République',$1,public.ST_Transform(public.ST_SetSRID(public.ST_MakePoint(lon,45.76),4326),2154)
  FROM (VALUES ('Boîte A',4.83),('Boîte B',4.84),('Boîte C',4.85)) AS x(label,lon) RETURNING id_boite`,[commune]);
 const [a,b,c]=rows.map(row=>row.id_boite);
 await client.query('UPDATE bdd_clap.boites SET adresse=$1 WHERE id_boite=$2',['Rue des Écoles '+suffix,a]);
 await client.query('UPDATE bdd_clap.boites SET adresse=$1 WHERE id_boite=1',['Rue des E\u0301coles '+suffix]);
 const deposit=async(id,title,genre)=>{
  const res=await fetch(new URL('/api/boxes/'+id+'/books',base),{
   method:'POST',headers:{cookie,Origin:base.origin,'Content-Type':'application/json'},
   body:JSON.stringify({title,author:'Camille',genre})
  });
  assert.equal(res.status,201);
  return (await res.json()).book.id;
 };
 await deposit(a,'Les Jardins '+suffix,'Polar');
 await deposit(a,'Une autre histoire','Roman');
 await deposit(b,'Les Jardins '+suffix+' %_ littéral','Roman');
 const removed=await deposit(c,'Les Jardins '+suffix,'Roman');
 await client.query('UPDATE bdd_clap.livre_position SET id_boite=NULL WHERE id_exemplaire=$1',[removed]);

 const query=async(params,expected=200,authenticated=true)=>{
  const res=await fetch(new URL('/api/boxes?'+new URLSearchParams({mode:'map',...params}),base),
   {headers:authenticated?{cookie}:{}});
  assert.equal(res.status,expected,JSON.stringify(params));
  if(expected===200)return res.json();
 };
 const expectBoxes=async(params,ids)=>{
  const result=await query(params);
  assert.deepEqual(result.items.map(box=>box.id),ids.map(id=>'pg:'+id));
  assert.equal(result.total,ids.length);
  assert.ok(result.totalAll>=ids.length);
 };
 await query({commune},401,false);
 for(const invalid of [{},{commune:'1.2'},{department:'2147483648'},{books:'invalid'},{title:'x'.repeat(151)},{genre:'x'.repeat(81)},{title:'x\0y'},{commune,west:4}]){
  await query(invalid,400);
 }
 await expectBoxes({commune},[a,b,c]);
 const street='  ECOLES '+suffix+'  ';
 await expectBoxes({street},[a,1]);
 await expectBoxes({commune,street},[a]);
 await expectBoxes({commune,street:''},[a,b,c]);
 await expectBoxes({street:' ',west:4.82,east:4.86,south:45.75,north:45.77},[a,b,c]);
 await expectBoxes({commune,street:'%_'},[]);
 await query({street:'x'.repeat(121)},400);
 await query({street:'x\0y'},400);
 await expectBoxes({department},[a,b,c]);
 await expectBoxes({commune,department:1},[]);
 await expectBoxes({commune,books:'with'},[a,b]);
 await expectBoxes({commune,books:'without'},[c]);
 await expectBoxes({commune,title:'les JARDINS '+suffix},[a,b]);
 await expectBoxes({commune,department,books:'with',title:'les jardins '+suffix,genre:'rOmAn'},[b]);
 await expectBoxes({commune,books:'without',genre:'Roman'},[]);
 await expectBoxes({commune,title:'%_'},[b]);
 await expectBoxes({commune,title:"' OR 'a'='a"},[]);
 await expectBoxes({commune,west:4.834,east:4.846,south:45.75,north:45.77},[b]);
 await expectBoxes({mode:'table',q:'Boîte C',books:'with'},[c]);
 await expectBoxes({mode:'table',q:'Boîte C',street},[c]);
 const choices=await fetch(new URL('/api/communes',base),{headers:{cookie}});
 assert.equal(choices.status,200);
 assert.deepEqual((await choices.json()).find(item=>item.id===commune),{
  id:commune,name:'Lyon',postalCode:'69002',department:{id:department,name:'Rhône',code:'69'}
 });
 console.log('OK : filtres cumulables, même exemplaire présent, compte/liste, limites géographiques et tableau.');
}finally{await client.end();}
