# SOA - Turistička Aplikacija

## Preduslovi

Pre pokretanja, morate imati instalirano na svom računaru:
*   [Git](https://git-scm.com/)
*   [Docker](https://www.docker.com/products/docker-desktop/)
*   Docker Compose (dolazi uz Docker Desktop)

## Pokretanje projekta

Sve što je potrebno da uradite je da pratite sledeće korake:

1.  **Klonirajte repozitorijum:**
    ```bash
    git clone https://github.com/tvoje-ime/soa-project.git
    ```

2.  **Pozicionirajte se u folder projekta:**
    ```bash
    cd soa-project
    ```

3.  **Pokrenite celu aplikaciju pomoću Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    Prvi put će ovo potrajati nekoliko minuta jer Docker mora da preuzme sve potrebne slike i izgradi vaše servise.

## Pristup servisima

Kada se sve pokrene, servisi su dostupni na sledećim adresama:

*   **Frontend (React aplikacija):** [http://localhost:3000](http://localhost:3000)
*   **Stakeholders Servis:** [http://localhost:8081](http://localhost:8081)
*   **Blog Servis:** [http://localhost:8082](http://localhost:8082)
*   **MySQL Baza (za alate):** Host: `localhost`, Port: `3307`, User: `root`, Pass: `root_password`

## Zaustavljanje aplikacije

Da biste zaustavili i obrisali sve kontejnere, pokrenite sledeću komandu iz korena projekta:
```bash
docker-compose down
