Serwis zarządza rejestracją i logowaniem użytkowników.

## Struktura tabeli users:

- `id`
- `email`
- `password` (hasło przechowywać zaszyfrowane np. bcrypt)

## Endpointy:

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/register` | Rejestracja nowego użytkownika (`email`, `password`). Zwraca `id` użytkownika. |
| POST | `/api/login` | Logowanie użytkownika (`email` + `password`). Zwraca **JWT token**. |

## Uwaga:

Endpointy modyfikujące dane (POST, DELETE, PATCH) w serwisach **Książki** i **Zamówienia** muszą wymagać poprawnego JWT (autoryzacja).