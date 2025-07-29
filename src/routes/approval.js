const express = require('express');
const ApprovalController = require('../controllers/approvalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const approvalValidator = require('../validators/approvalValidator');

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle modérateur minimum
router.use(authMiddleware);
router.use(roleMiddleware.moderateur);

// Routes d'approbation
router.post(
  '/poi/:id/approve',
  validationMiddleware(approvalValidator.params, 'params'),
  validationMiddleware(approvalValidator.approve),
  ApprovalController.approvePOI
);

router.post(
  '/poi/:id/reject',
  validationMiddleware(approvalValidator.params, 'params'),
  validationMiddleware(approvalValidator.reject),
  ApprovalController.rejectPOI
);

router.post(
  '/poi/:id/reapprove',
  validationMiddleware(approvalValidator.params, 'params'),
  validationMiddleware(approvalValidator.reapprove),
  ApprovalController.reapprovePOI
);

// Routes de consultation
router.get(
  '/pending',
  validationMiddleware(approvalValidator.pendingFilters, 'query'),
  ApprovalController.getPendingPOIs
);

router.get(
  '/history/:id',
  validationMiddleware(approvalValidator.params, 'params'),
  ApprovalController.getModerationHistory
);

router.get(
  '/stats',
  validationMiddleware(approvalValidator.statsQuery, 'query'),
  ApprovalController.getModerationStats
);

module.exports = router;
