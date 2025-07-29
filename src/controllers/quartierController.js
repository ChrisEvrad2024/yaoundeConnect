// src/controllers/quartierController.js
const { Quartier, Arrondissement, Town } = require('../models');

class QuartierController {
  // GET /api/quartiers - Lister tous les quartiers
  static async getAllQuartiers(req, res) {
    try {
      const { town_id, arrondissement_id, limit = 100 } = req.query;

      const whereConditions = {};
      if (town_id) whereConditions.town_id = town_id;
      if (arrondissement_id) whereConditions.arrondissement_id = arrondissement_id;

      const quartiers = await Quartier.findAll({
        where: whereConditions,
        include: [
          {
            model: Arrondissement,
            attributes: ['id', 'name']
          },
          {
            model: Town,
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit)
      });

      res.json({
        message: 'Quartiers récupérés avec succès',
        data: quartiers,
        total: quartiers.length
      });
    } catch (error) {
      console.error('Erreur récupération quartiers:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur serveur',
        status: 500,
        detail: 'Erreur lors de la récupération des quartiers'
      });
    }
  }

  // GET /api/quartiers/:id - Obtenir un quartier par ID
  static async getQuartierById(req, res) {
    try {
      const { id } = req.params;

      const quartier = await Quartier.findByPk(id, {
        include: [
          {
            model: Arrondissement,
            attributes: ['id', 'name']
          },
          {
            model: Town,
            attributes: ['id', 'name']
          }
        ]
      });

      if (!quartier) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Quartier non trouvé',
          status: 404,
          detail: "Le quartier demandé n'existe pas"
        });
      }

      res.json({
        message: 'Quartier récupéré avec succès',
        data: quartier
      });
    } catch (error) {
      console.error('Erreur récupération quartier:', error);
      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur serveur',
        status: 500,
        detail: 'Erreur lors de la récupération du quartier'
      });
    }
  }
}

module.exports = QuartierController;
