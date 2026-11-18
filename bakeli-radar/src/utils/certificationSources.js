const OFFICIAL_ORGANIZATION_SITES = {
  'ANAQ-Sup': 'https://anaqsup.sn',
  'BEM Dakar': 'https://bem.sn',
  'CFPT Sénégal-Japon': 'https://cfptsj.sn',
  'ESEA Dakar': 'https://esea.ucad.sn',
  'ENEA Dakar': 'https://esea.ucad.sn',
  'ENDSS': 'https://endss.ucad.sn',
  'EPT Thiès': 'https://ept.edu.sn',
  'ENSA Thiès': 'https://www.univ-thies.sn',
  'ISM Online / ISF': 'https://online.groupeism.sn',
  'Office du Bac Formation': 'https://officedubac.sn',
  'Simplon Sénégal': 'https://simplon.sn',
  "Sup'Info Sénégal": 'https://supinfo.sn',
  'Institut Vatel': 'https://www.vatel.sn',
  anaqSup: 'https://anaqsup.sn',
  bakeli: 'https://bakeli.tech',
  cesag: 'https://www.cesag.sn',
  eptSectionPro: 'https://ept.edu.sn',
  eptThies: 'https://ept.edu.sn',
  esmt: 'https://www.esmt.sn',
  esmtDakar: 'https://www.esmt.sn',
  groupeIsm: 'https://www.groupeism.sn',
  ism: 'https://www.groupeism.sn',
  orangeDigitalCenter: 'https://www.orange.sn',
  sencampus: 'https://www.sencampus.com',
  uasz: 'https://uasz.sn',
  ucadMedecine: 'https://www.ucad.sn',
  ugb: 'https://www.ugb.sn',
};

const normalizeOrganizationName = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s/g, '');

const OFFICIAL_SITES_BY_ORGANIZATION = new Map(
  Object.entries(OFFICIAL_ORGANIZATION_SITES).map(([name, url]) => [
    normalizeOrganizationName(name),
    url,
  ])
);

const isHttpUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value);

export const getOfficialOrganizationWebsite = (certification) => {
  const providedWebsite =
    certification?.officialWebsite ||
    certification?.siteWeb ||
    certification?.organisme?.siteWeb;

  if (isHttpUrl(providedWebsite)) return providedWebsite;

  const organization = typeof certification?.organisme === 'string'
    ? certification.organisme
    : certification?.organisme?.nom ||
      certification?.organisme?.name ||
      certification?.organisme?.title;

  return OFFICIAL_SITES_BY_ORGANIZATION.get(
    normalizeOrganizationName(String(organization || ''))
  ) || '';
};
