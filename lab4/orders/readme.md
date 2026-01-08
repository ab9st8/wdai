Serwis odpowiada za tworzenie i zarządzanie zamówieniami użytkowników.

## Struktura tabeli orders:

- `id`
- `userId`
- `bookId`
- `quantity`

## Endpointy:

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/orders/:userId` | Zwraca listę zamówień użytkownika |
| POST | `/api/orders` | Dodaje zamówienie (`userId`, `bookId`, `quantity`) i zwraca `id` zamówienia. **Sprawdź, czy `bookId` istnieje** (należy wykorzystać serwis 1. Nie wykonywać bezpośrednio zapytania do bazy!) |
| DELETE | `/api/orders/:orderId` | Usuwa zamówienie |
| PATCH | `/api/orders/:orderId` | Aktualizuje wybrane dane zamówienia (np. ilość) |