import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reverseAddress} from '../src/lib/server/reverse-address.ts';
import {parentCommuneCode,postalCodeCommune} from '../src/lib/types/communes.ts';

const hit={type:'housenumber',street:'Rue Émile Blémont',housenumber:'12 bis',distance:18,citycode:'75118'};
const result=properties=>async()=>Response.json({features:properties?[{properties}]:[]});

test('only coordinates and search parameters are sent to IGN',async()=>{
 assert.deepEqual(await reverseAddress(48.89,2.34,async(url,options)=>{
  assert.equal(url.href,'https://data.geopf.fr/geocodage/reverse?lat=48.89&lon=2.34&index=address&limit=1');
  assert.equal(options.headers,undefined);
  assert.equal(options.redirect,'error');
  assert.ok(options.signal instanceof AbortSignal);
  return result(hit)();
 }),{address:'12 bis, Rue Émile Blémont',inseeCode:'75118'});
});

test('no invented numbers, no distant addresses and no locality-only suggestions',async()=>{
 const street={...hit,type:'street',housenumber:undefined,street:undefined,name:hit.street};
 assert.equal((await reverseAddress(48.89,2.34,result(street))).address,hit.street);
 assert.equal((await reverseAddress(48.89,2.34,result({...hit,housenumber:undefined}))).address,hit.street);
 for(const properties of [null,{...hit,distance:61},{...hit,type:'municipality'},{...hit,citycode:'invalid'}]){
  assert.equal(await reverseAddress(48.89,2.34,result(properties)),null);
 }
});

test('provider failure is distinct from an empty search',async()=>{
 await assert.rejects(reverseAddress(48.89,2.34,async()=>new Response('',{status:503})));
 await assert.rejects(reverseAddress(48.89,2.34,async()=>Response.json({bad:'payload'})));
});

test('municipal arrondissements match their parent, other communes stay unchanged',()=>{
 for(const [district,postcode,parent] of [['75118','75018','75056'],['69389','69009','69123'],['13216','13016','13055']]){
  assert.equal(parentCommuneCode(district),parent);
  assert.equal(postalCodeCommune(postcode),parent);
 }
 assert.equal(parentCommuneCode('75121'),'75121');
 assert.equal(postalCodeCommune('75021'),undefined);
});
