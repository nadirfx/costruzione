// seeds the mock store with the same projects the live app has
window.__seed = () => {
  const s = window.__mockStore; if (s.size) return;
  s.set('projects/mcdonalds-concept', { title: "Spot McDonald's (concept)", format: 'A', status: 'revisione', aspect: '9:16', versions: [{ v: 1, assetId: 'f0021fda6b83f62419ee3792ad4ed561', label: 'prima versione', durationSec: 17.6 }], createdAt: '2026-11-24T14:00:00Z', updatedAt: '2026-11-24T16:00:00Z' });
  s.set('projects/instagram-chiude-luca', { title: 'Instagram chiude · voce Luca', format: 'B', status: 'revisione', aspect: '9:16', versions: [{ v: 1, assetId: '354ebf0e7031adfdf4b92961779860e8', label: 'pausa con tensione', durationSec: 39.85 }], createdAt: '2026-11-24T11:00:00Z', updatedAt: '2026-11-24T15:00:00Z' });
  s.set('projects/whatsapp', { title: 'WhatsApp a pagamento', format: 'B', status: 'approvato', aspect: '9:16', versions: [], createdAt: '2026-11-22T12:00:00Z', updatedAt: '2026-11-22T20:00:00Z' });
};
