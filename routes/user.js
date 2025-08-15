import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', authMiddleware, userController.getAllUsers);

export default router;