import express from 'express';
import { getSessionCart, addItemToCart, removeItemFromCart, updateItemQuantity, emptyCart } from '../controllers/cartController.js';

const router = express.Router();

router.get('/:sessionId', getSessionCart);
router.post('/add', addItemToCart);
router.post('/remove', removeItemFromCart);
router.post('/update', updateItemQuantity);
router.delete('/:sessionId', emptyCart);

export default router;
