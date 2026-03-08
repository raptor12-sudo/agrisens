import client from './client';
export const getDevicesByGateway = (gwId)  => client.get(`/devices/gateway/${gwId}`);
export const getDevice           = (id)    => client.get(`/devices/${id}`);
