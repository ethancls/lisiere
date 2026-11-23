export function parseCoordinates(lat:unknown,lon:unknown){
 if(typeof lat!=='string'||typeof lon!=='string'||!lat.trim()||!lon.trim())return null;
 const latitude=Number(lat),longitude=Number(lon);
 return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=85.051128&&Math.abs(longitude)<=180
  ?{latitude,longitude}:null;
}
