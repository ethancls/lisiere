import assert from 'node:assert/strict';
import test from 'node:test';
import {searchPlaces} from '../src/lib/server/places.ts';

const feature=(type,name,city,postcode,coordinates=[4.83,45.76])=>({
 geometry:{type:'Point',coordinates},properties:{type,name,city,postcode}
});
const street=feature('street','Rue de la République','Lyon','69002');
const city=feature('municipality','Saint-Étienne','Saint-Étienne','42000');
const reply=(...features)=>Response.json({features});

test('normalizes whitespace and sends only search parameters to the official address index',async()=>{
 for(const query of ['Saint-Étienne','saint etien','rue de la republique','rue de la repub lyon']){
  const feature=query.startsWith('rue')?street:city;
  const places=await searchPlaces('  '+query.replaceAll(' ','  ')+'  ',async(url,init)=>{
   assert.equal(url.origin+url.pathname,'https://data.geopf.fr/geocodage/search');
   assert.deepEqual(Object.fromEntries(url.searchParams),{q:query,index:'address',limit:'6'});
   assert.equal(init.credentials,'omit');
   assert.equal(init.headers,undefined);
   assert.equal(init.redirect,'error');
   return reply(feature);
  });
  const {name,city:commune,postcode,type}=feature.properties;
  assert.deepEqual(places,[{label:name,locality:postcode+' '+commune,center:[4.83,45.76],kind:type}]);
 }
});

test('full postal codes only return exact municipality matches',async()=>{
 const results=await searchPlaces('42000',async(url)=>{
  assert.equal(url.searchParams.get('type'),'municipality');
  assert.equal(url.searchParams.get('postcode'),'42000');
  return reply(city,street,feature('municipality','Lyon','Lyon','69001'));
 });
 assert.deepEqual(results.map(place=>place.locality),['42000 Saint-Étienne']);
});

test('keeps homonyms in different communes and drops duplicate or invalid features',async()=>{
 const homonym=feature('street','Rue de la République','Villeurbanne','69100');
 const invalid=feature('street','Rue A','Lyon','69002',[200,45]);
 const results=await searchPlaces('rue de la republique',async()=>reply(invalid,street,street,homonym));
 assert.deepEqual(results.map(place=>place.locality),['69002 Lyon','69100 Villeurbanne']);
});

test('empty results and invalid queries do not masquerade as provider failures',async()=>{
 const unexpected=()=>assert.fail('provider request');
 assert.deepEqual(await searchPlaces(' é ',unexpected),[]);
 assert.deepEqual(await searchPlaces('a'.repeat(121),unexpected),[]);
 assert.deepEqual(await searchPlaces('inconnu',async()=>reply()),[]);
 await assert.rejects(searchPlaces('lyon',async()=>new Response(null,{status:429})));
 await assert.rejects(searchPlaces('lyon',async()=>Response.json({error:'invalid'})));
});

test('propagates client cancellation and sets a provider deadline',async()=>{
 const controller=new AbortController();
 const pending=searchPlaces('lyon',async(_url,{signal})=>new Promise((_,reject)=>{
  signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
 }),controller.signal);
 controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
 const keepAlive=setTimeout(()=>{},4000);
 try{
  await assert.rejects(searchPlaces('lyon',async(_url,{signal})=>new Promise((_,reject)=>{
   signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  })),{name:'TimeoutError'});
 }finally{clearTimeout(keepAlive);}
});
