import { Router } from 'express';
import { signUp, logIn } from '../controllers/authController';
import { validateRequest } from '../middlewares/validation';
import { signUpSchema } from '../validations/authValidation';

const router = Router();

router.post('/signup', validateRequest(signUpSchema), signUp);
router.post('/login', logIn);

export default router;