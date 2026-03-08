import client from './client';
export const getAlertes   = (params) => client.get('/alertes', { params });
export const getStats     = ()       => client.get('/alertes/stats');
export const acquitter    = (id)     => client.patch(`/alertes/${id}/acquitter`);
export const resoudre     = (id)     => client.patch(`/alertes/${id}/resoudre`);
