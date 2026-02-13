import { Router } from 'express';
import { signUp, logIn } from '../controllers/authController';
import { validateBody } from '../middlewares/validation';
import { signUpSchema } from '../validations/authValidation';

const router = Router();

router.post('/signup', validateBody(signUpSchema), signUp);
router.post('/login', logIn);

export default router;