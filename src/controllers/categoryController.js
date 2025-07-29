// src/controllers/categoryController.js
const { Category } = require('../models');

class CategoryController {
  // GET /api/categories - Lister toutes les catégories
  static async getAllCategories(req, res) {
    try {
      const { parent_id, langue = 'fr', limit = 100 } = req.query;

      const whereConditions = { langue };
      if (parent_id) {
        whereConditions.parent_id = parent_id;
      } else {
        // Par défaut, récupérer seulement les catégories principales (sans parent)
        whereConditions.parent_id = null;
      }

      const categories = await Category.findAll({
        where: whereConditions,
        include: [
          {
            model: Category,
            as: 'children',
            required: false,
            where: { langue },
            attributes: ['id', 'name', 'slug', 'icon']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit)
      });

      res.json({
        message: 'Catégories récupérées avec succès',
        data: categories,
        total: categories.length
      });
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur serveur',
        status: 500,
        detail: 'Erreur lors de la récupération des catégories'
      });
    }
  }

  // GET /api/categories/:id - Obtenir une catégorie par ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: Category,
            as: 'children',
            attributes: ['id', 'name', 'slug', 'icon']
          }
        ]
      });

      if (!category) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Catégorie non trouvée',
          status: 404,
          detail: "La catégorie demandée n'existe pas"
        });
      }

      res.json({
        message: 'Catégorie récupérée avec succès',
        data: category
      });
    } catch (error) {
      console.error('Erreur récupération catégorie:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur serveur',
        status: 500,
        detail: 'Erreur lors de la récupération de la catégorie'
      });
    }
  }
}

module.exports = CategoryController;
