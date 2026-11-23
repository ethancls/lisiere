export function parentCommuneCode(inseeCode:string){
 if(/^751(?:0[1-9]|1[0-9]|20)$/.test(inseeCode))return '75056';
 if(/^6938[1-9]$/.test(inseeCode))return '69123';
 if(/^132(?:0[1-9]|1[0-6])$/.test(inseeCode))return '13055';
 return inseeCode;
}

export function postalCodeCommune(postalCode:string){
 if(/^750(?:0[1-9]|1[0-9]|20)$/.test(postalCode)||postalCode==='75116')return '75056';
 if(/^6900[1-9]$/.test(postalCode))return '69123';
 if(/^130(?:0[1-9]|1[0-6])$/.test(postalCode))return '13055';
}
