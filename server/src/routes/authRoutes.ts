import express from 'express';
import { registerUser, loginUser, getUsers, deleteUser } from '../controllers/authController';
import { logAudit } from '../middleware/auditMiddleware';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser, logAudit('USER_REGISTERED'));
router.post('/login', loginUser, logAudit('USER_LOGIN'));
router.get('/', protect, authorize('ADMIN'), getUsers);
router.delete('/:id', protect, authorize('ADMIN'), deleteUser, logAudit('USER_DELETED'));

export default router;
