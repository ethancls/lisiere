export interface Box { id:string;name:string;address:string;city:string;postalCode:string;latitude:number;longitude:number;description:string;department?:string|null;departmentCode?:string|null;inseeCode?:string|null }
export interface Bounds { west:number;east:number;south:number;north:number }
export interface BoxPage { items:Box[];total:number;totalAll:number;page:number;pageSize:number;pages:number;truncated:boolean }
export interface Coordinates {latitude:number;longitude:number}
