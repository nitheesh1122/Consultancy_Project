import express from 'express';
import { registerUser, loginUser, getUsers, deleteUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);
router.delete('/:id', deleteUser);

export default router;
