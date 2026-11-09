import pandas as pd
import re
from datetime import date, datetime


class DataCleaner:
    """
    Normalise un DataFrame RAW (sortie des scrapers) vers le format enrichi
    attendu par l'API radar_jobs.

    Format RAW attendu (colonnes optionnelles sauf title/location/url) :
        title, company, location, description, date, url,
        contract_type, sector, source, source_url

    Format de sortie (compatible API) :
        scraped_date, publish_date, title, company, location, contract_type,
        education_level, experience_level, key_skills, sector, offer_url, source,
        min_exp, max_exp, min_education, education_rank, latitude, longitude, coordinates
    """

    def __init__(self, df=None):
        # Mapping de normalisation des régions
        self.region_map = {
            'Dakar - Sénégal': 'Dakar',
            'Région de Dakar': 'Dakar',
            'Dakar, Sénégal': 'Dakar',
            'Thiès - Sénégal': 'Thiès',
            'Région de Thiès': 'Thiès',
            'Saint-Louis - Sénégal': 'Saint-Louis',
            'Etranger - Sénégal': 'Étranger',
            'Tout le Sénégal': 'Sénégal (Multi-régions)',
            'International': 'Étranger',
            'Télétravail': 'Remote',
            'Remote': 'Remote'
        }
        # Marqueur du fallback générique (à exclure de la détection par mots-clés)
        self.fallback_marker = 'opportunité professionnelle pour le poste de'
        # Dictionnaire de compétences détectables (titre + description réelle)
        self.skills_keywords = {
            'Informatique': ['informatique', 'technicien en informatique'],
            'Développement': ['develop', 'développ', 'developer', 'software', 'programmeur', 'application'],
            'Python': ['python'], 'Django': ['django'], 'React': ['react'],
            'JavaScript': ['javascript', 'js'], 'PHP': ['php'], 'Laravel': ['laravel'],
            'Java': ['java'], 'Cloud': ['cloud', 'aws', 'azure'],
            'Data': ['data', 'données', 'big data'], 'IA': [' ia ', 'intelligence artificielle', 'machine learning', 'deep learning'],
            'Réseaux': ['réseau', 'reseau', 'cisco'], 'Cybersécurité': ['cyber', 'sécurité'],
            'Comptabilité': ['comptab', 'comptable'], 'Finance': ['finance', 'financier'],
            'Marketing': ['marketing'], 'Communication': ['communication'],
            'Vente': ['vente', 'commercial', 'vendeur'], 'Gestion': ['gestion'],
            'Logistique': ['logistique', 'stock'], 'Transport': ['transport', 'livraison'],
            'Santé': ['santé', 'sante', 'médical', 'infirmier'],
            'Éducation': ['éducation', 'enseignant', 'professeur', 'formation'],
            'BTP': ['btp', 'bâtiment', 'génie civil', 'chantier'],
            'Droit': ['droit', 'juriste', 'juridique'],
            'RH': ['ressources humaines', 'assistant rh', 'gestionnaire rh', ' human resources'],
        }
        # Détection de secteur par mots-clés (ordre = priorité)
        self.sector_keywords = [
            # Note : 'developer'/'development' seuls exclus (ambigu "Business Developers" commercial) ;
            # l'IT se détecte via software/data/informatique/technical/technicien.
            ('Informatique', ['developpeur', 'développeur', 'software', 'data', 'informatique', 'cloud', 'intelligence artificielle', 'cyber', 'réseau', 'technicien en informatique', 'technical', 'technicien(ne) en informatique', 'programmeur']),

            ('Finance', ['comptable', 'finance', 'audit', 'budget', 'trésorerie']),
            ('Marketing', ['marketing', 'community manager', 'communication', 'digital']),
            ('Commerce', ['commercial', 'vente', 'vendeur', 'business dev']),
            ('Santé', ['santé', 'médical', 'infirmier', 'pharmacie']),
            ('Éducation', ['enseignant', 'professeur', 'éducation', 'formation']),
            ('BTP', ['btp', 'génie civil', 'chantier', 'conducteur de travaux']),
            ('Transport', ['chauffeur', 'livraison', 'transport', 'logistique']),
        ]
        # Coordonnées GPS pour les principales villes du Sénégal
        self.geo_map = {
            'Dakar': [14.7167, -17.4677],
            'Thiès': [14.7833, -16.9167],
            'Saint-Louis': [16.0167, -16.5000],
            'Ziguinchor': [12.5833, -16.2719],
            'Diourbel': [14.6500, -16.2333],
            'Louga': [15.6167, -16.2167],
            'Kolda': [12.8833, -14.9500],
            'Matam': [15.6500, -13.2500],
            'Fatick': [14.3333, -16.4000],
            'Kaolack': [14.1333, -16.0833],
            'Kaffrine': [14.1000, -15.5333],
            'Kédougou': [12.5500, -12.1833],
            'Sédhiou': [12.7000, -15.5500],
            'Tamba': [13.7667, -13.6667],
            'Tambacounda': [13.7667, -13.6667],
            'Étranger': [0, 0],
            'Remote': [14.7167, -17.4677],
            'Sénégal (Multi-régions)': [14.4974, -14.4524]
        }

    # ---------------------------------------------------------------
    # Nettoyage par colonne
    # ---------------------------------------------------------------
    def extract_experience(self, exp_text):
        """Extrait min_exp et max_exp depuis un texte (ou par défaut 0, 0)."""
        if exp_text is None or (isinstance(exp_text, float) and pd.isna(exp_text)):
            return 0, 0
        if isinstance(exp_text, (int, float)):
            return int(exp_text), int(exp_text)
        text = str(exp_text).lower()
        if text in ("", "nan", "none", "n/a"):
            return 0, 0

        numbers = [int(n) for n in re.findall(r'\d+', text)]

        if any(kw in text for kw in ['débutant', 'jeune diplômé', 'etudiant']):
            if len(numbers) >= 1:
                return 0, numbers[0]
            return 0, 1

        if len(numbers) >= 2:
            return numbers[0], numbers[1]
        elif len(numbers) == 1:
            if "plus de" in text or ">" in text or "supérieur" in text:
                return numbers[0], numbers[0] + 5
            return numbers[0], numbers[0]

        return 0, 0

    def extract_min_education(self, edu_text):
        """Extrait le niveau d'éducation minimum et son rang."""
        if edu_text is None or (isinstance(edu_text, float) and pd.isna(edu_text)):
            return "N/A", -1
        text = str(edu_text).lower()
        if text in ("", "nan", "none", "n/a"):
            return "N/A", -1

        patterns = [
            (r'qualification avant bac', 'Avant Bac', 0),
            (r'bac\+8', 'Bac+8', 7),
            (r'doctorat', 'Bac+8', 7),
            (r'bac\+5', 'Bac+5', 6),
            (r'master', 'Bac+5', 6),
            (r'bac\+4', 'Bac+4', 5),
            (r'bac\+3', 'Bac+3', 4),
            (r'bac\+2', 'Bac+2', 3),
            (r'bac\+1', 'Bac+1', 2),
            (r'bac(?!\+)', 'Bac', 1)
        ]

        found_matches = []
        for pattern, label, rank in patterns:
            if re.search(pattern, text):
                found_matches.append((label, rank))

        if not found_matches:
            if 'bac' in text:
                return 'Bac', 1
            return "N/A", -1

        min_edu = min(found_matches, key=lambda x: x[1])
        return min_edu[0], min_edu[1]

    def clean_title(self, title):
        """Nettoie le titre du poste."""
        if title is None or (isinstance(title, float) and pd.isna(title)):
            return "N/A"

        title = str(title)
        # 0. Supprime les émojis et symboles décoratifs
        emoji_pat = re.compile(
            "["
            "\U0001F000-\U0001FEFF"
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002700-\U000027BF"
            "\U00002600-\U000026FF"
            "\U00002B00-\U00002BFF"
            "\U0000FE00-\U0000FE0F"
            "]+", flags=re.UNICODE)
        title = emoji_pat.sub('', title)

        # 1. Supprime H/F, (M/F) et ce qui suit
        title = re.sub(r'\s*[\(\[]?h/f[\)\]]?.*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*[\(\[]?m/f[\)\]]?.*', '', title, flags=re.IGNORECASE)

        # 2. Split par les séparateurs classiques (tiret, pipe) -> première partie
        parts = re.split(r'\s+[\-\–\—\|]\s+', title)
        title = parts[0]

        # 3. Nettoyer les (e), (fe), (h/f) résiduels
        title = re.sub(r'\(f/h\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\(h/f\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\(fe\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\(e\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\(h\)', '', title, flags=re.IGNORECASE)

        # 4. Doubles espaces et strip
        title = re.sub(r'\s+', ' ', title).strip()

        return title.title()

    def clean_location(self, loc_text):
        """Normalise la localisation vers une ville/région du Sénégal."""
        if loc_text is None or (isinstance(loc_text, float) and pd.isna(loc_text)):
            return "Sénégal (Multi-régions)"
        text = str(loc_text)
        if text.lower() in ("", "nan", "none", "non spécifié", "n/a"):
            return "Sénégal (Multi-régions)"

        # Nettoyage "Région de "
        text = re.sub(r'région de\s*', '', text, flags=re.IGNORECASE).strip()

        # Si multi-régions avec &, on prend la première
        if "&" in text:
            text = text.split("&")[0].strip()

        # Application du map
        normalized = self.region_map.get(text, text.split('-')[0].strip() if '-' in text else text)

        # Cherche une ville/région connue dans le texte
        if normalized not in self.geo_map:
            for region in self.geo_map.keys():
                if region.lower() in text.lower():
                    normalized = region
                    break

        return normalized

    def clean_contract(self, contract_text):
        """Standardise le type de contrat."""
        if contract_text is None or (isinstance(contract_text, float) and pd.isna(contract_text)):
            return "N/A"
        text = str(contract_text).strip()
        if text.lower() in ("", "nan", "none", "n/a"):
            return "N/A"
        parts = re.split(r'[&,\-]', text)
        return parts[0].strip()

    def clean_sector(self, sector_text):
        """Valeurs de secteur propres ; 'Non spécifié' si inconnu."""
        if sector_text is None or (isinstance(sector_text, float) and pd.isna(sector_text)):
            return "Non spécifié"
        text = str(sector_text).strip()
        if text.lower() in ("", "nan", "none", "n/a", "non spécifié"):
            return "Non spécifié"
        return text.title()

    @staticmethod
    def _parse_date(val):
        """Convertit une valeur de date en chaîne ISO (YYYY-MM-DD) ou ''."""
        if val is None:
            return ''
        if isinstance(val, datetime):
            return val.date().isoformat()
        if isinstance(val, date):
            return val.isoformat()
        try:
            return str(val).strip()
        except Exception:
            return ''

    @staticmethod
    def _first_authoritative_url(row):
        """Renvoie une URL absolue fiable pour l'offre."""
        for col in ('url', 'offer_url', 'source_url'):
            if col in row and row[col] and str(row[col]) != 'nan':
                return str(row[col])
        return ''

    # ---------------------------------------------------------------
    # Pipeline principal
    # ---------------------------------------------------------------
    def extract_company_from_title(self, title):
        """Extrait l'entreprise depuis des patterns courants : 'X Recrute', 'Recrutement X :', 'X : poste'."""
        if not title or not isinstance(title, str):
            return ''
        t = title.strip()
        m = re.match(r'^(.+?)\s+recrute\b', t, flags=re.IGNORECASE)
        if m:
            cand = re.sub(r'\s+01$|\s+\d+$', '', m.group(1)).strip(' :-–—')
            if 2 < len(cand) < 60:
                return cand
        m = re.match(r'^recrutement\s+(.+?)\s*:', t, flags=re.IGNORECASE)
        if m:
            cand = m.group(1).strip(' :-–—')
            if 2 < len(cand) < 60 and 'recrutement' not in cand.lower():
                return cand
        m = re.match(r'^offre\s+de\s+(?:recrutement|stage|emploi)\s*:\s*(.+?)\s*[-–—]\s*(.+)$', t, flags=re.IGNORECASE)
        if m:
            cand = m.group(1).strip()
            if 2 < len(cand) < 60:
                return cand
        return ''

    def _real_description(self, description):
        """Ignore le fallback générique pour la détection (évite les faux positifs)."""
        desc = str(description or '')
        if self.fallback_marker in desc.lower():
            return ''
        return desc

    def extract_skills(self, title, description):
        """Détecte les compétences par mots-clés dans titre + description réelle."""
        text = f" {str(title or '').lower()} {self._real_description(description).lower()} "
        found = [label for label, kws in self.skills_keywords.items() if any(k in text for k in kws)]
        return ', '.join(found[:8])

    def detect_sector(self, title, description):
        """Détecte le secteur par mots-clés dans titre + description réelle."""
        text = f" {str(title or '').lower()} {self._real_description(description).lower()} "
        for sector, kws in self.sector_keywords:
            if any(k in text for k in kws):
                return sector
        return ''

    def detect_contract(self, title, description, current=''):
        """Détecte CDI/CDD/Stage/Freelance depuis titre + description réelle."""
        text = f" {str(title or '').lower()} {self._real_description(description).lower()} "
        if 'stage' in text or 'stagiaire' in text or 'alternance' in text:
            return 'Stage'
        if 'freelance' in text or 'consultant' in text or 'prestation' in text:
            return 'Freelance'
        if re.search(r'\bcdd\b', text):
            return 'CDD'
        if re.search(r'\bcdi\b', text):
            return 'CDI'
        if current and str(current).strip().lower() not in ('', 'nan', 'none', 'n/a', 'non spécifié'):
            return str(current).strip()
        return ''

    def infer_type(self, row):
        title = str(row.get('title', '')).lower()
        contract = str(row.get('contract_type', '')).lower()
        if 'stage' in title or 'stage' in contract or 'alternance' in title:
            return 'Stage'
        if 'bourse' in title:
            return 'Bourse'
        if 'concours' in title or 'ena' in title or 'recrutement direct' in title:
            return 'Concours'
        if 'formation' in title or 'bootcamp' in title or 'certification' in title:
            return 'Formation'
        if 'freelance' in contract or 'prestation' in title or 'consultant' in title:
            return 'Prestation'
        return 'Emploi'

    def clean(self, df):
        """
        Normalise un DataFrame RAW vers le format final enrichi.
        Renvoie le DataFrame nettoyé (ou None si vide).
        """
        if df is None or df.empty:
            print("Le fichier de données est vide.")
            return None

        df = df.copy()

        # Normalisation des colonnes manquantes
        for col in ('title', 'company', 'location', 'description', 'date',
                    'url', 'contract_type', 'sector', 'source', 'source_url'):
            if col not in df.columns:
                df[col] = ''

        # Clé unique d'offre (source + url) pour la déduplication
        df['offer_url'] = df.apply(lambda r: self._first_authoritative_url(r), axis=1)

        # 1. Dedup par source+url
        key = df[['source', 'offer_url']].fillna('')
        df['_key'] = key['source'].astype(str) + '::' + key['offer_url'].astype(str)
        df = df.drop_duplicates(subset='_key', keep='first').drop(columns='_key')

        # 2. Nettoyage Titre
        df['title'] = df['title'].apply(self.clean_title)

        # 3. Normalisation des régions
        df['location'] = df['location'].apply(self.clean_location)

        # 4. Extraction Expérience (si textuelle) / défaut si vide
        if 'experience_level' in df.columns and df['experience_level'].notna().any():
            df[['min_exp', 'max_exp']] = df['experience_level'].apply(
                lambda x: pd.Series(self.extract_experience(x)))
        else:
            df['experience_level'] = ''
            df[['min_exp', 'max_exp']] = df['contract_type'].apply(
                lambda x: pd.Series(self.extract_experience(x)))

        # 5. Extraction Education
        if 'education_level' in df.columns and df['education_level'].notna().any():
            df[['min_education', 'education_rank']] = df['education_level'].apply(
                lambda x: pd.Series(self.extract_min_education(x)))
        else:
            df['education_level'] = ''
            df[['min_education', 'education_rank']] = df['education_level'].apply(
                lambda x: pd.Series(self.extract_min_education(x)))

        # 6. Normalisation Contrat + détection par mots-clés (titre/description)
        df['contract_type'] = df['contract_type'].apply(self.clean_contract)
        mask_no_contract = df['contract_type'].isin(['', 'N/A'])
        if mask_no_contract.any():
            df.loc[mask_no_contract, 'contract_type'] = df[mask_no_contract].apply(
                lambda r: self.detect_contract(r.get('title', ''), r.get('description', ''), '') or 'N/A', axis=1)

        # 6bis. Entreprise extraite du titre si absente
        def _fix_company(row):
            c = str(row.get('company', '')).strip()
            if not c or c.lower() in ('nan', 'none', 'non spécifiée', 'non spécifié', ''):
                found = self.extract_company_from_title(str(row.get('title', '')))
                return found or c or 'Non spécifiée'
            return c
        df['company'] = df.apply(_fix_company, axis=1)

        # 6ter. Secteur détecté par mots-clés si absent
        def _fix_sector(row):
            s = str(row.get('sector', '')).strip()
            if not s or s.lower() in ('nan', 'none', 'non spécifié', ''):
                return self.detect_sector(row.get('title', ''), row.get('description', '')) or 'Non spécifié'
            return s
        df['sector'] = df.apply(_fix_sector, axis=1)

        # 7bis. Type d'offre normalisé (Emploi, Stage, Bourse, Concours, Prestation, Formation)
        df['type'] = df.apply(self.infer_type, axis=1)

        # 7ter. Description enrichie ou fallback professionnel
        if 'description' in df.columns:
            def clean_desc(row):
                desc = str(row.get('description', '')).strip()
                if not desc or desc.lower() in ('nan', 'none', ''):
                    t = str(row.get('title', 'Poste'))
                    c = str(row.get('company', 'Entreprise partenaire'))
                    l = str(row.get('location', 'Dakar'))
                    return f"Opportunité professionnelle pour le poste de {t} chez {c} à {l}. Poste ouvert au Sénégal avec perspectives d'évolution."
                return desc[:300] + ('...' if len(desc) > 300 else '')
            df['description'] = df.apply(clean_desc, axis=1)
        else:
            df['description'] = ''

        # 8. GPS
        df['latitude'] = df['location'].apply(lambda x: self.geo_map.get(x, [14.4974, -14.4524])[0])
        df['longitude'] = df['location'].apply(lambda x: self.geo_map.get(x, [14.4974, -14.4524])[1])
        df['coordinates'] = df['location'].apply(lambda x: self.geo_map.get(x, [14.4974, -14.4524]))

        # 9. Compétences clés : existantes nettoyées + détection par mots-clés si vides
        if 'key_skills' not in df.columns:
            df['key_skills'] = ''
        df['key_skills'] = df['key_skills'].fillna('').str.replace(' - ', ', ').str.replace(';', ', ')
        mask_no_skills = df['key_skills'].str.strip().isin(['', 'nan', 'None'])
        if mask_no_skills.any():
            df.loc[mask_no_skills, 'key_skills'] = df[mask_no_skills].apply(
                lambda r: self.extract_skills(r.get('title', ''), r.get('description', '')), axis=1)

        # 10. Dates
        df['publish_date'] = df['date'].apply(self._parse_date)
        df['scraped_date'] = date.today().isoformat()

        # 11. Champs dérivés attendus
        if 'salary_avg' not in df.columns:
            df['salary_avg'] = ''

        # 12. Ordre des colonnes final (compatible API)
        final_cols = [
            'scraped_date', 'publish_date', 'title', 'company', 'location',
            'type', 'contract_type', 'description', 'education_level', 'experience_level', 'key_skills',
            'sector', 'offer_url', 'source', 'min_exp', 'max_exp', 'min_education',
            'education_rank', 'latitude', 'longitude', 'coordinates',
        ]
        # Colonnes supplémentaires éventuelles (ex: salary_avg)
        extra = [c for c in df.columns if c not in final_cols and c not in
                 ('date', 'url', 'source_url')]
        final_cols = final_cols + extra

        df = df[final_cols]

        # 12. Re-dedup final sur offer_url (global)
        df = df.drop_duplicates(subset='offer_url', keep='first')

        return df


def concat_raw_frames(frames):
    """Concatène les listes d'offres de plusieurs scrapers en un seul DataFrame RAW."""
    import pandas as pd
    if not frames:
        return None
    records = [job for frame in frames for job in frame]
    if not records:
        return None
    return pd.DataFrame(records)
