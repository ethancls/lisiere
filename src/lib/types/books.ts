export type BoxBook = {
 id: number;
 title: string;
 author: string | null;
 isbn: string | null;
 info: string | null;
 genre: string | null;
};

export const maxBookTitleLength = 150;
export const maxBookGenreLength = 80;

export const bookFields = [
 {name: 'title', label: 'Titre', max: maxBookTitleLength, required: true},
 {name: 'author', label: 'Auteur', max: 150, required: true},
 {name: 'genre', label: 'Genre', max: maxBookGenreLength, required: false},
 {name: 'isbn', label: 'ISBN', max: 13, required: false},
 {name: 'info', label: 'Informations', max: 200, required: false}
] as const;

export type BookInput = Omit<BoxBook, 'id'> & {author: string};
