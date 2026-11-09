# API — Annuaire des Certifications du Sénégal

## 1. Adresse du backend

Pour le développement :

http://localhost:5000

## 2. Authentification

### Inscription

POST /api/auth/register

Body :

```json
{
  "name": "Ali",
  "email": "ali@test.com",
  "password": "123456"
}
```

Réponse :

```json
{
  "message": "Utilisateur créé"
}
```

### Connexion

POST /api/auth/login

Body :

```json
{
  "email": "ali@test.com",
  "password": "123456"
}
```

Réponse :

```json
{
  "message": "Connexion réussie",
  "token": "JWT_TOKEN"
}
```

## 3. Profil

### Voir le profil

GET /api/auth/profile

Header :

```text
Authorization: Bearer JWT_TOKEN
```

## 4. Certifications

### Liste

GET /api/certifications

Cette route est publique.

### Une certification

GET /api/certifications/:id

Exemple :

GET /api/certifications/ID_CERTIFICATION

### Créer

POST /api/certifications

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "title": "Développeur Web",
  "sigle": "DW",
  "description": "Formation en développement web",
  "niveau": "Licence",
  "duree": "12 mois",
  "modalite": "Présentiel",
  "domaine": "ID_DOMAINE",
  "sousDomaine": "ID_SOUS_DOMAINE",
  "metiers": [
    "ID_METIER"
  ],
  "competences": [
    "ID_COMPETENCE"
  ],
  "organisme": "ID_ORGANISME",
  "etablissements": [
    "ID_ETABLISSEMENT"
  ]
}
```

### Modifier

PUT /api/certifications/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "title": "Développeur Web Full Stack",
  "sigle": "DWFS",
  "description": "Formation complète en développement web",
  "niveau": "Licence",
  "duree": "14 mois",
  "modalite": "Hybride",
  "domaine": "ID_DOMAINE",
  "sousDomaine": "ID_SOUS_DOMAINE",
  "metiers": [
    "ID_METIER"
  ],
  "competences": [
    "ID_COMPETENCE"
  ],
  "organisme": "ID_ORGANISME",
  "etablissements": [
    "ID_ETABLISSEMENT"
  ]
}
```

### Supprimer

DELETE /api/certifications/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 5. Domaines et sous-domaines

### Liste des domaines

GET /api/domaines

### Un domaine

GET /api/domaines/:id

### Liste des sous-domaines

GET /api/domaines/sous-domaines

### Un sous-domaine

GET /api/domaines/sous-domaines/:id

### Créer un domaine

POST /api/domaines

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Informatique",
  "description": "Domaine des technologies de l'information"
}
```

### Modifier un domaine

PUT /api/domaines/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Informatique et numérique",
  "description": "Technologies de l'information et du numérique"
}
```

### Supprimer un domaine

DELETE /api/domaines/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Créer un sous-domaine

POST /api/domaines/sous-domaines

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Développement logiciel",
  "description": "Développement d'applications et de logiciels",
  "domaine": "ID_DOMAINE"
}
```

### Modifier un sous-domaine

PUT /api/domaines/sous-domaines/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Développement Web",
  "description": "Développement d'applications web",
  "domaine": "ID_DOMAINE"
}
```

### Supprimer un sous-domaine

DELETE /api/domaines/sous-domaines/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 6. Métiers

### Liste

GET /api/metiers

### Un métier

GET /api/metiers/:id

### Créer

POST /api/metiers

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Développeur Web",
  "description": "Conçoit et développe des applications web"
}
```

### Modifier

PUT /api/metiers/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Développeur Full Stack",
  "description": "Développe des applications frontend et backend"
}
```

### Supprimer

DELETE /api/metiers/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 7. Compétences

### Liste

GET /api/competences

### Une compétence

GET /api/competences/:id

### Créer

POST /api/competences

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "JavaScript",
  "description": "Programmation avec le langage JavaScript"
}
```

### Modifier

PUT /api/competences/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "JavaScript avancé",
  "description": "Développement avancé avec JavaScript"
}
```

### Supprimer

DELETE /api/competences/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 8. Organismes certificateurs

### Liste

GET /api/organismes

### Un organisme

GET /api/organismes/:id

### Créer

POST /api/organismes

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Institut Supérieur du Numérique",
  "sigle": "ISN",
  "description": "Organisme de formation et de certification",
  "adresse": "Dakar",
  "email": "contact@isn.test",
  "telephone": "771234567"
}
```

### Modifier

PUT /api/organismes/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Institut Supérieur du Numérique",
  "sigle": "ISN",
  "description": "Organisme de formation et de certification numérique",
  "adresse": "Dakar",
  "email": "contact@isn.test",
  "telephone": "771234567"
}
```

### Supprimer

DELETE /api/organismes/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 9. Établissements

### Liste

GET /api/etablissements

### Un établissement

GET /api/etablissements/:id

### Créer

POST /api/etablissements

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "École Supérieure de Technologie",
  "adresse": "Dakar",
  "email": "contact@est.test",
  "telephone": "771112233"
}
```

### Modifier

PUT /api/etablissements/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "École Supérieure de Technologie",
  "adresse": "Dakar",
  "email": "contact@est.test",
  "telephone": "778889900"
}
```

### Supprimer

DELETE /api/etablissements/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 10. Sources

### Liste

GET /api/sources

### Une source

GET /api/sources/:id

### Créer

POST /api/sources

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Ministère de l'Enseignement Supérieur",
  "type": "Institution",
  "url": "https://example.com",
  "description": "Source officielle d'information"
}
```

### Modifier

PUT /api/sources/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Ministère de l'Enseignement Supérieur",
  "type": "Institution",
  "url": "https://example.com",
  "description": "Source officielle mise à jour"
}
```

### Supprimer

DELETE /api/sources/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Collecter des candidats de certification

POST /api/scraper/collect-certifications

Authentification : administrateur ou éditeur. La collecte est une prévisualisation : elle n'enregistre aucune certification.

Body facultatif :

```json
{
  "sourceIds": ["force-n", "cdp", "senegal-commerce", "vie-publique"]
}
```

Sans `sourceIds`, les quatre sources configurées sont analysées. FORCE-N est la seule de ces sources qui publie un catalogue de certifications identifié. Vie Publique renvoie aussi les sites sénégalais découverts dans son annuaire, sans les parcourir.

### Importer des candidats vérifiés

POST /api/scraper/import-certifications

Authentification : administrateur ou éditeur. Limite de 100 candidats par requête. Les doublons sont ignorés, les fiches importées restent non publiées et une source liée est créée pour chaque fiche.

```json
{
  "candidats": [
    {
      "title": "Nom de la certification",
      "description": "Description publiée par la source",
      "sourceName": "FORCE-N",
      "sourceUrl": "https://force-n.sn/formations"
    }
  ]
}
```

## 11. Documents

### Liste

GET /api/documents

### Un document

GET /api/documents/:id

### Créer

POST /api/documents

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Guide certification.pdf",
  "type": "PDF",
  "url": "https://example.com/document.pdf",
  "description": "Document justificatif",
  "source": "ID_SOURCE",
  "certification": "ID_CERTIFICATION"
}
```

### Modifier

PUT /api/documents/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "nom": "Guide certification 2026.pdf",
  "type": "PDF",
  "url": "https://example.com/document-2026.pdf",
  "description": "Document justificatif mis à jour",
  "source": "ID_SOURCE",
  "certification": "ID_CERTIFICATION"
}
```

### Supprimer

DELETE /api/documents/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 12. Reconnaissances

### Liste

GET /api/reconnaissances

### Une reconnaissance

GET /api/reconnaissances/:id

### Créer

POST /api/reconnaissances

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "type": "Accréditation",
  "nom": "Accréditation nationale",
  "description": "Accréditation de la certification",
  "organisme": "ID_ORGANISME",
  "certification": "ID_CERTIFICATION"
}
```

### Modifier

PUT /api/reconnaissances/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "type": "Habilitation",
  "nom": "Habilitation nationale",
  "description": "Habilitation mise à jour",
  "organisme": "ID_ORGANISME",
  "certification": "ID_CERTIFICATION"
}
```

### Supprimer

DELETE /api/reconnaissances/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 13. Recherche

### Rechercher des certifications

GET /api/search/certifications

Exemple :

/api/search/certifications?q=web

### Recherche avec niveau

/api/search/certifications?q=web&niveau=Licence

### Recherche avec plusieurs filtres

/api/search/certifications?q=web&niveau=Licence&modalite=Présentiel

### Tous les filtres

/api/search/certifications?q=web&niveau=Licence&modalite=Présentiel&domaine=ID_DOMAINE&sousDomaine=ID_SOUS_DOMAINE&organisme=ID_ORGANISME&etablissement=ID_ETABLISSEMENT&metier=ID_METIER&competence=ID_COMPETENCE

## 14. Contributions

### Créer une contribution

POST /api/contributions

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "type": "Modification",
  "contenu": "Nouvelle information",
  "certification": "ID_CERTIFICATION"
}
```

### Liste

GET /api/contributions

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Une contribution

GET /api/contributions/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Modifier le statut

PUT /api/contributions/:id/status

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "statut": "acceptee",
  "commentaire": "Informations vérifiées"
}
```

## 15. Utilisateurs

### Liste

GET /api/users

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Un utilisateur

GET /api/users/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

### Créer un utilisateur

POST /api/users

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "name": "Moussa",
  "email": "moussa@test.com",
  "password": "123456",
  "role": "editor"
}
```

### Modifier un utilisateur

PUT /api/users/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "name": "Moussa Diop",
  "email": "moussa@test.com",
  "role": "verifier"
}
```

### Modifier le rôle

PUT /api/users/:id/role

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

Body :

```json
{
  "role": "editor"
}
```

### Supprimer un utilisateur

DELETE /api/users/:id

Authentification :

```text
Authorization: Bearer JWT_TOKEN
```

## 16. Historique / Audit

### Liste des audits

GET /api/audit

Réservé à l'administration.

Header :

```text
Authorization: Bearer JWT_TOKEN
```

## 17. Rôles

Les rôles disponibles sont :

* admin
* editor
* verifier
* etablissement

## 18. Codes HTTP

200 = succès

201 = création réussie

400 = données incorrectes

401 = authentification nécessaire

403 = accès interdit

404 = ressource introuvable

500 = erreur serveur