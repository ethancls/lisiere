export interface Box { id:string;name:string;address:string;city:string;postalCode:string;latitude:number;longitude:number;description:string;department?:string|null;departmentCode?:string|null;inseeCode?:string|null }
export interface Bounds { west:number;east:number;south:number;north:number }
export interface BoxPage { items:Box[];total:number;totalAll:number;page:number;pageSize:number;pages:number;truncated:boolean }
export interface Coordinates {latitude:number;longitude:number}
export type BoxFilters = {
 commune: number | null;
 department: number | null;
 street: string;
 books: 'all' | 'with' | 'without';
 title: string;
 genre: string;
};
export type FilterCommune = {
 id: number;
 name: string;
 postalCode: string;
 department: {id:number;name:string;code:string} | null;
};
export const maxStreetLength = 120;
export const emptyBoxFilters: BoxFilters = {commune:null,department:null,street:'',books:'all',title:'',genre:''};
export function countBoxFilters(filters:BoxFilters){
 return Number(filters.commune!==null)+Number(filters.department!==null)+Number(filters.books!=='all')+
  Number(!!filters.street.trim())+Number(!!filters.title.trim())+Number(!!filters.genre.trim());
}
