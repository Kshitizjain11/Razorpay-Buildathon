import express from 'express';
import { getCatalog, getProductDetails } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/', getCatalog);
router.get('/:id', getProductDetails);

export default router;
