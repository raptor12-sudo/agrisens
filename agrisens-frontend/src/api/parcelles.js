import client from './client';
export const getParcelles = (fermeId) => client.get(`/parcelles/ferme/${fermeId}`);
export const getParcelle  = (id)      => client.get(`/parcelles/${id}`);
