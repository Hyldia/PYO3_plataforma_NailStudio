import { Router } from 'express';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';
import equipoRoutes from './equipoRoutes.js';

const api = Router();
api.use('/admin', adminRoutes);
api.use('/equipo', equipoRoutes);
api.use('/', publicRoutes);
export default api;
