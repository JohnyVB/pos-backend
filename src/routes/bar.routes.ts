import { Router } from 'express';
import { authMiddleware } from "../middleware/auth.middleware";
import { checkoutTable, getBarLayout, saveTableAccount } from '../controllers/bar.cotrollers';

const router = Router();

router.use(authMiddleware);

router.get('/layout/:store_id', getBarLayout);
router.post('/save-account', saveTableAccount);
router.post('/checkout', checkoutTable);

export default router;