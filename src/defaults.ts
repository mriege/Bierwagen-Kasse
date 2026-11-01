import type { State } from './types';

const PFAND_GLAS = 'pfand-glas';
const PFAND_MASS = 'pfand-mass';

export const getInitialState = (): State => ({
  pfandTypes: [
    { id: PFAND_GLAS, label: 'Glas', amountCents: 100 },
    { id: PFAND_MASS, label: 'Maßkrug', amountCents: 500 },
  ],
  drinks: [
    { id: 'd-pils', iconName: 'Beer', label: 'Pils', size: '0,5 L', priceCents: 450, pfandTypeId: PFAND_GLAS },
    { id: 'd-helles', iconName: 'Beer', label: 'Helles', size: '0,5 L', priceCents: 450, pfandTypeId: PFAND_GLAS },
    { id: 'd-weizen', iconName: 'Wheat', label: 'Weizen', size: '0,5 L', priceCents: 480, pfandTypeId: PFAND_GLAS },
    { id: 'd-radler', iconName: 'Citrus', label: 'Radler', size: '0,5 L', priceCents: 430, pfandTypeId: PFAND_GLAS },
    { id: 'd-mass', iconName: 'Beer', label: 'Maß Helles', size: '1,0 L', priceCents: 1100, pfandTypeId: PFAND_MASS },
    { id: 'd-spezi', iconName: 'CupSoda', label: 'Spezi', size: '0,5 L', priceCents: 380, pfandTypeId: PFAND_GLAS },
    { id: 'd-wasser', iconName: 'Droplet', label: 'Wasser', size: '0,5 L', priceCents: 300, pfandTypeId: PFAND_GLAS },
  ],
  order: [],
  returns: [],
});
