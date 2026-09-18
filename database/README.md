# AURELIA — baza sklepu

Baza jest przygotowana pod PostgreSQL / Supabase.

## Co jest w środku

- produkty i kategorie
- zdjęcia produktów
- warianty (np. kolor / materiał / rozmiar)
- magazyn i rezerwacje
- klienci i adresy
- koszyki
- zamówienia i pozycje zamówień
- płatności
- wysyłki i numery śledzenia
- kupony rabatowe
- newsletter
- formularz kontaktowy
- widok `storefront_products` do bezpiecznego pobierania aktywnych produktów

## Uruchomienie

1. Załóż projekt w Supabase.
2. Otwórz SQL Editor.
3. Uruchom `schema.sql`.
4. Następnie uruchom `seed.sql`.
5. Dopiero potem podłącz frontend AURELII do Supabase Data API.

GitHub Pages pozostaje frontendem. GitHub Pages jest hostingiem statycznym i nie uruchamia PHP/Pythona po stronie serwera, dlatego baza/backend muszą działać poza Pages. Supabase daje pełny PostgreSQL oraz Data API dla aplikacji frontendowych.

## Ważne bezpieczeństwo

Nigdy nie umieszczaj w repozytorium klucza Supabase service-role. W frontendzie można używać wyłącznie klucza publicznego/anonymousego z odpowiednio skonfigurowanym RLS.

## Następny etap

Podłączenie `shop.html` do `storefront_products`, a następnie:
- panel administracyjny,
- logowanie klientów,
- prawdziwy koszyk,
- checkout,
- płatności,
- zamówienia.
