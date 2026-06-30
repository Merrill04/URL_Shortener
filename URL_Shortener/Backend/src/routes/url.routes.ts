import {Router} from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {createUrl, listUrls, getUrl, updateUrl, deleteUrl} from '../controllers/url.controller';

const router = Router();

router.use(authenticate);

router.post('/', createUrl);
router.get('/',listUrls);
router.get('/:id', getUrl);
router.patch('/:id', updateUrl);
router.post('/:id', deleteUrl);

export default router;