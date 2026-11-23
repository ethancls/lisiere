export type Place = {
 label: string;
 locality: string;
 center: [number, number];
 kind: 'municipality' | 'street' | 'housenumber';
};

export const minPlaceQueryLength = 3;
export const maxPlaceQueryLength = 120;
