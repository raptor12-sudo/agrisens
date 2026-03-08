import client from './client';
export const getUsers  = ()     => client.get('/users');
export const getUser   = (id)   => client.get(`/users/${id}`);
export const updateUser = (id, data) => client.put(`/users/${id}`, data);
export const deleteUser = (id)  => client.delete(`/users/${id}`);
