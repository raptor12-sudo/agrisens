import client from './client';
export const getFermes  = ()       => client.get('/fermes');
export const getFerme   = (id)     => client.get(`/fermes/${id}`);
export const createFerme = (data)  => client.post('/fermes', data);
