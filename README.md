# ShortDrama Africa — Dockerisation

## 1. Présentation

**ShortDrama Africa** est une plateforme africaine de mini-séries vidéo. Ce dépôt contient le travail de conteneurisation de son backend Node.js avec Docker et Docker Compose.

L'objectif est de disposer d'un environnement de développement local reproductible, isolé et facile à démarrer.

## 2. Architecture

L'environnement repose sur trois services :

| Service | Technologie | Fonction |
|---|---|---|
| API | Node.js 22 / Express | Backend REST |
| DB | PostgreSQL 17 | Base de données |
| Mailpit | Mailpit | Capture des emails de test |

### Architecture technique

- Dockerfile multi-stage pour construire l'image de production.
- Prisma ORM pour l'accès à PostgreSQL.
- Volume Docker nommé pour la persistance des données.
- Docker Compose pour orchestrer les services.
- Exécution de l'API avec un utilisateur non privilégié (`node`).

## 3. Technologies utilisées

- Node.js 22
- Express.js
- PostgreSQL 17
- Prisma ORM 6
- Docker
- Docker Compose
- Mailpit
- Nodemailer

## 4. Prérequis

Installer les outils suivants :

- Docker Desktop avec intégration WSL2, ou Docker Engine.
- Docker Compose v2.
- Git.

## 5. Installation

Cloner le dépôt :

```bash
git clone <URL_DU_DEPOT>
cd shortdrama-docker
```

Créer le fichier d'environnement :

```bash
cp .env.example .env
```

Configurer les variables dans `.env`, notamment :

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `ACCESS_SECRET`
- `REFRESH_SECRET`

Utiliser des secrets personnels forts et ne jamais publier le fichier `.env`.

Protéger le fichier :

```bash
chmod 600 .env
```

## 6. Construction et démarrage

Construire l'image de l'API :

```bash
docker build --target production -t shortdrama-api:1.0 .
```

Démarrer PostgreSQL et Mailpit :

```bash
docker compose up -d db mailpit
```

Appliquer les migrations Prisma :

```bash
docker compose run --rm --no-deps api npx prisma migrate deploy
```

Démarrer l'API :

```bash
docker compose up -d api
```

Vérifier les services :

```bash
docker compose ps
```

## 7. Accès aux services

| Service | Adresse |
|---|---|
| API | http://localhost:3001 |
| Mailpit | http://localhost:8025 |
| PostgreSQL | Accessible depuis le réseau Docker |

Exemple de test HTTP :

```bash
curl -i http://localhost:3001/api/categories
```

## 8. Commandes utiles

Afficher les conteneurs :

```bash
docker compose ps
```

Consulter les logs :

```bash
docker compose logs -f api
```

Redémarrer les services :

```bash
docker compose restart
```

Arrêter les services :

```bash
docker compose down
```

Vérifier les migrations :

```bash
docker compose run --rm --no-deps api npx prisma migrate status
```

## 9. Persistance des données

PostgreSQL utilise un volume Docker nommé :

```text
shortdrama_postgres_data
```

Les données sont conservées après le redémarrage ou la suppression des conteneurs, tant que le volume n'est pas supprimé.

**Attention :** ne pas utiliser `docker compose down -v` sans vouloir explicitement supprimer les volumes et les données associées.

## 10. Sécurité

Quelques précautions appliquées :

- Fichier `.env` exclu du contexte de construction Docker.
- Secrets non intégrés dans l'image.
- Image construite en plusieurs étapes.
- Dépendances installées avec `npm ci`.
- Application exécutée avec l'utilisateur non-root `node`.
- Dépendances de développement exclues de l'image finale.

## 11. Périmètre

Ce projet concerne uniquement la conteneurisation locale du backend ShortDrama Africa.

Les services externes comme Cloudinary et CamPay ne sont pas configurés pour un fonctionnement réel dans cet environnement de test.

Les identifiants et secrets de production ne doivent jamais être utilisés ici.

---

**Projet pédagogique DevOps — ShortDrama Africa**

Conteneurisation d'une application Node.js, PostgreSQL et orchestration Docker Compose.
