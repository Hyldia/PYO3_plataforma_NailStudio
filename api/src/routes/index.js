import { Router } from 'express';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';

const api = Router();
api.use('/admin', adminRoutes);
api.use('/', publicRoutes);
export default api;
