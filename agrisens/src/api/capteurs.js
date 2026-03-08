import client from './client';
export const getCapteurs    = (deviceId)            => client.get(`/capteurs/device/${deviceId}`);
export const getDerniere    = (id)                  => client.get(`/capteurs/${id}/derniere`);
export const getLectures    = (id, params)          => client.get(`/capteurs/${id}/lectures`, { params });
export const getStats       = (id, date)            => client.get(`/capteurs/${id}/stats`, { params: { date } });
