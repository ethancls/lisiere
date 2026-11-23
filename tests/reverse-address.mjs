import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reverseAddress} from '../src/lib/server/reverse-address.ts';
import {communeCode} from '../src/lib/server/commune-boundary.ts';

const hit={type:'housenumber',street:'Rue Émile Blémont',housenumber:'12 bis',distance:18,citycode:'75118'};
const result=properties=>async()=>Response.json({features:properties?[{properties}]:[]});

test('only coordinates and search parameters are sent to IGN',async()=>{
 assert.deepEqual(await reverseAddress(48.89,2.34,async(url,options)=>{
  assert.equal(url.href,'https://data.geopf.fr/geocodage/reverse?lat=48.89&lon=2.34&index=address&limit=1');
  assert.equal(options.headers,undefined);
  assert.equal(options.redirect,'error');
  assert.ok(options.signal instanceof AbortSignal);
  return result(hit)();
 }),'12 bis, Rue Émile Blémont');
});

test('no invented numbers, no distant addresses and no locality-only suggestions',async()=>{
 const street={...hit,type:'street',housenumber:undefined,street:undefined,name:hit.street};
 assert.equal(await reverseAddress(48.89,2.34,result(street)),hit.street);
 assert.equal(await reverseAddress(48.89,2.34,result({...hit,housenumber:undefined})),hit.street);
 for(const properties of [null,{...hit,distance:61},{...hit,type:'municipality'}]){
  assert.equal(await reverseAddress(48.89,2.34,result(properties)),null);
 }
});

test('provider failure is distinct from an empty search',async()=>{
 let attempts=0;
 await assert.rejects(reverseAddress(48.89,2.34,async()=>{attempts++;return new Response('',{status:503});}),/HTTP 503/);
 assert.equal(attempts,2);
 for(const [response,message] of [
  [()=>new Response('',{status:429}),/HTTP 429/],
  [()=>Response.json({bad:'payload'}),/invalid response shape/]
 ]){
  attempts=0;
  await assert.rejects(reverseAddress(48.89,2.34,async()=>{attempts++;return response();}),message);
  assert.equal(attempts,1);
 }
});

test('recovers once from an IGN timeout, network error or gateway failure',async()=>{
 for(const fail of [
  ()=>{throw new DOMException('Timeout','TimeoutError');},
  ()=>{throw new TypeError('Failed to fetch');},
  ()=>new Response('',{status:502})
 ]){
  let attempts=0;
  assert.equal(await reverseAddress(48.89,2.34,async()=>++attempts===1?fail():result(hit)()),'12 bis, Rue Émile Blémont');
  assert.equal(attempts,2);
 }
});

test('only a unique official boundary result is accepted, including Paris and Corsica',async()=>{
 const point={latitude:48.894745,longitude:2.341769};
 const response=rows=>async(url,options)=>{
  assert.equal(url.href,'https://geo.api.gouv.fr/communes?lat=48.894745&lon=2.341769&fields=code');
  assert.equal(options.headers,undefined);
  assert.ok(options.signal instanceof AbortSignal);
  return Response.json(rows);
 };
 assert.equal(await communeCode(point,response([{code:'75056'}])),'75056');
 assert.equal(await communeCode(point,response([{code:'2A004'}])),'2A004');
 assert.equal(await communeCode(point,response([])),null);
 assert.equal(await communeCode(point,response([{code:'75056'},{code:'92012'}])),null);
 await assert.rejects(communeCode(point,response([{code:'invalid'}])));
 await assert.rejects(communeCode(point,async()=>new Response('',{status:503})));
});
