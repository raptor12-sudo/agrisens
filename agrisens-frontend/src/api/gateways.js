import client from './client';
export const getGateways = (fermeId) => client.get(`/gateways/ferme/${fermeId}`);
export const getGateway  = (id)      => client.get(`/gateways/${id}`);
