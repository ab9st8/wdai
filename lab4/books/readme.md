Serwis przechowuje informacje o książkach dostępnych w księgarni.

---

## Struktura tabeli books:

- `id` (PK, auto-increment)
- `title` (nazwa książki)
- `author`
- `year` (rok wydania)

## Endpointy:

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/books` | Zwraca listę wszystkich książek |
| GET | `/api/books/:bookId` | Zwraca dane konkretnej książki |
| POST | `/api/books` | Dodaje nową książkę (`title`, `author`, `year`) i zwraca jej `id` |
| DELETE | `/api/books/:bookId` | Usuwa książkę o podanym `id` |