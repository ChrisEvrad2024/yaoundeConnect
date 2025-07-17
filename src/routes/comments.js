const express = require('express');
const CommentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const commentValidator = require('../validators/commentValidator');

const router = express.Router();

// Routes publiques
// GET /api/poi/:poiId/comments - Lister les commentaires d'un POI
router.get('/poi/:poiId/comments',
    validationMiddleware(commentValidator.params, 'params'),
    validationMiddleware(commentValidator.list, 'query'),
    CommentController.getCommentsByPOI
);

// GET /api/comments/:id - Obtenir un commentaire
router.get('/:id',
    validationMiddleware(commentValidator.params, 'params'),
    CommentController.getComment
);

// GET /api/poi/:poiId/comments/stats - Stats commentaires d'un POI
router.get('/poi/:poiId/comments/stats',
    validationMiddleware(commentValidator.params, 'params'),
    CommentController.getCommentStats
);

// Routes authentifiées
router.use(authMiddleware);

// POST /api/comments - Créer un commentaire
router.post('/',
    validationMiddleware(commentValidator.create),
    CommentController.createComment
);

// PUT /api/comments/:id - Mettre à jour un commentaire
router.put('/:id',
    validationMiddleware(commentValidator.params, 'params'),
    validationMiddleware(commentValidator.update),
    CommentController.updateComment
);

// DELETE /api/comments/:id - Supprimer un commentaire
router.delete('/:id',
    validationMiddleware(commentValidator.params, 'params'),
    CommentController.deleteComment
);

// POST /api/comments/:id/like - Liker/unliker un commentaire
router.post('/:id/like',
    validationMiddleware(commentValidator.params, 'params'),
    CommentController.toggleLike
);

// POST /api/comments/:id/report - Signaler un commentaire
router.post('/:id/report',
    validationMiddleware(commentValidator.params, 'params'),
    validationMiddleware(commentValidator.report),
    CommentController.reportComment
);

module.exports = router;
