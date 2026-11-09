
# ANCPS — Back-office frontend React JSX

Cette version traite la partie **back-office** du cahier des charges V1 tout en conservant le langage visuel du frontend fourni :
- vert émeraude `emerald-900 / emerald-700`
- accent jaune
- cartes blanches, bordures légères, ombres discrètes
- typographie Inter
- responsive mobile-first
- composants simples et professionnels, sans transformer l'interface publique en portail administratif lourd.

## Important
C'est une **implémentation frontend-only**. Les données sont simulées et persistées dans `localStorage`. L'authentification est une démonstration UI ; elle ne remplace pas une vraie authentification serveur.

## Comptes de démonstration
- `admin@ancps.sn` / `admin` — Super administrateur
- `editor@ancps.sn` / `editor` — Administrateur éditorial
- `verif@ancps.sn` / `verif` — Vérificateur
- `etablissement@ancps.sn` / `demo` — Établissement / institution

## Fonctionnalités
- Dashboard : certifications publiées/en attente/expirées/archivées, organismes, établissements, demandes, documents, analytics et score de complétude.
- Certifications : CRUD, duplication, publication/dépublication, archivage, suppression, statut de vérification, historique des décisions (autorité, référence, source, dates de validité), objectifs, compétences.
- Organismes certificateurs.
- Établissements.
- Métiers.
- Compétences.
- Sources.
- Documents.
- Demandes à vérifier : accepter, demander un complément, rejeter, ou soumettre une nouvelle demande.
- Import CSV/Excel : mapping, prévisualisation, validation, détection de doublons et rapport d'erreurs.
- Historique/audit.
- Notifications.
- Utilisateurs/rôles.
- Paramétrage des domaines et niveaux.

## Fonctionnalités ajoutées (complément au cahier des charges)
- Liaison Certification ↔ Établissements ("Où se former"), ↔ Métiers ("Débouchés") et ↔ Compétences du référentiel, éditable dans la fiche certification et affichée dans l'aperçu.
- Champ **Nature** (diplôme national / certification professionnelle / certification privée) exposé dans le formulaire.
- Chaque Source / Document peut être rattaché à une **certification liée**.
- **Alertes d'échéance J-180 / J-90 / J-30** sur le tableau de bord (accréditations proches de leur date de fin de validité, calculées sur la décision la plus récente).
- **Soumission de nouvelle demande** de contribution (formulaire "Nouvelle demande") pour les rôles disposant de la permission `requests.create`.
- **Historique des décisions (traçabilité, §5.1 et §12.3)** : chaque certification conserve une liste `decisions` (statut, autorité, référence, dates de validité, source/preuve) qui ne s'écrase jamais — toute vérification ajoute une nouvelle décision à l'historique au lieu de remplacer la précédente. L'aperçu affiche ce "bloc de confiance" pour chaque décision.

## Démarrage
```bash
npm install
npm run dev
```

Le frontend public reste accessible via les routes existantes et le back-office via `/admin`.
