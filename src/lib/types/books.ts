export type BoxBook = {
 id: number;
 title: string;
 author: string | null;
 isbn: string | null;
 info: string | null;
};

export const bookFields = [
 {name: 'title', label: 'Titre', max: 150, required: true},
 {name: 'author', label: 'Auteur', max: 150, required: true},
 {name: 'isbn', label: 'ISBN', max: 13, required: false},
 {name: 'info', label: 'Informations', max: 200, required: false}
] as const;

export type BookInput = Omit<BoxBook, 'id'> & {author: string};
