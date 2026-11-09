# Intégration ANCPS Back-office

Le projet conserve l'architecture modulaire de `src/pages/admin` et `src/components/admin`.

Éléments intégrés depuis `ANCPS_backoffice_frontend` :
- permissions et rôles dans `src/admin/services/adminData.js` ;
- composants UI réutilisables dans `src/admin/components/AdminUI.jsx` ;
- gestion des sources avec `src/pages/admin/Sources.jsx` ;
- menu et interface adaptés aux permissions de l'administrateur éditorial ;
- dépendances `lucide-react` et `xlsx` nécessaires au back-office.

Les pages existantes de `ANCPS_senegal` n'ont pas été regroupées dans un fichier géant : chaque fonctionnalité reste dans son composant/page.
