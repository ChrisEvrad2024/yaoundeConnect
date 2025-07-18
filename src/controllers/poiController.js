const POIService = require('../services/poiService');
const { upload } = require('../config/upload');
const notificationService = require('../services/notificationService');
const OSMService = require('../services/osmService');

class POIController {
  // POST /api/poi - Créer un nouveau POI
  static async createPOI(req, res) {
    try {
      const userId = req.user.id;
      const poiData = req.body;
      const imageFiles = req.files || [];

      // Créer le POI
      const poi = await POIService.createPOI(poiData, userId, imageFiles);

      // Envoyer la réponse HTTP IMMÉDIATEMENT
      res.status(201).json({
        message: "Point d'intérêt créé avec succès",
        data: poi
      });

      // Envoyer les notifications APRÈS la réponse (asynchrone)
      // Cela évite que l'utilisateur attende la notification
      setImmediate(async () => {
        try {
          const notificationService = require('../services/notificationService');
          await notificationService.notifyPOICreated(poi);
          console.log(`✅ Notifications envoyées pour POI ${poi.id}`);
        } catch (notificationError) {
          console.error('❌ Erreur notification création POI:', notificationError);
          // En cas d'erreur, on peut logger mais pas faire échouer la création
        }
      });
    } catch (error) {
      console.error('Erreur création POI:', error);

      if (error.message.includes('non trouvé') || error.message.includes('non trouvée')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'Ressource non trouvée',
          status: 404,
          detail: error.message
        });
      }

      if (
        error.message.includes('Coordonnées') ||
        error.message.includes('Latitude') ||
        error.message.includes('Longitude')
      ) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Coordonnées invalides',
          status: 400,
          detail: error.message
        });
      }

      try {
        const addressValidation = await OSMService.validateAddress(
          data.adress,
          data.latitude,
          data.longitude
        );

        if (!addressValidation.valid && addressValidation.distance_km > 1) {
          console.warn(
            ` Adresse potentiellement incohérente: distance ${addressValidation.distance_km}km`
          );
          // Optionnel : ajouter un warning dans la réponse
        }
      } catch (osmError) {
        console.warn(' Validation OSM indisponible:', osmError.message);
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de création',
        status: 500,
        detail: 'Une erreur est survenue lors de la création du POI'
      });
    }
  }

  // GET /api/poi/:id - Obtenir un POI par ID
  static async getPOI(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const poi = await POIService.getPOIById(id, true);

      // Vérifier si c'est en favori pour l'utilisateur connecté
      const isFavorite = await POIService.checkIfFavorite(id, userId);

      res.json({
        data: {
          ...poi,
          is_favorite: isFavorite
        }
      });
    } catch (error) {
      console.error('Erreur récupération POI:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: "Le point d'intérêt demandé n'existe pas"
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de récupération',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération du POI'
      });
    }
  }

  // GET /api/poi - Rechercher et lister les POI
  static async searchPOI(req, res) {
    try {
      const filters = req.query;
      const result = await POIService.searchPOI(filters);

      res.json({
        message: 'Recherche effectuée avec succès',
        data: result.data,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      console.error('Erreur recherche POI:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de recherche',
        status: 500,
        detail: 'Une erreur est survenue lors de la recherche'
      });
    }
  }

  // GET /api/poi/nearby - Rechercher des POI à proximité
  static async findNearbyPOI(req, res) {
    try {
      const { latitude, longitude, radius = 5, limit = 20 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Coordonnées requises',
          status: 400,
          detail: 'Les paramètres latitude et longitude sont requis'
        });
      }

      const nearbyPOIs = await POIService.findNearbyPOI(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        parseInt(limit)
      );

      res.json({
        message: 'Recherche de proximité effectuée avec succès',
        data: nearbyPOIs,
        center: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        radius: parseFloat(radius)
      });
    } catch (error) {
      console.error('Erreur recherche proximité:', error);

      if (error.message.includes('Coordonnées')) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Coordonnées invalides',
          status: 400,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de recherche proximité',
        status: 500,
        detail: 'Une erreur est survenue lors de la recherche de proximité'
      });
    }
  }

  // PUT /api/poi/:id - Mettre à jour un POI
  static async updatePOI(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const updatedPOI = await POIService.updatePOI(id, updateData, userId, userRole);

      res.json({
        message: 'POI mis à jour avec succès',
        data: updatedPOI
      });
    } catch (error) {
      console.error('Erreur mise à jour POI:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: "Le point d'intérêt demandé n'existe pas"
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Accès refusé',
          status: 403,
          detail: error.message
        });
      }

      if (error.message.includes('Coordonnées')) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Données invalides',
          status: 400,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de mise à jour',
        status: 500,
        detail: 'Une erreur est survenue lors de la mise à jour'
      });
    }
  }

  // DELETE /api/poi/:id - Supprimer un POI
  static async deletePOI(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const result = await POIService.deletePOI(id, userId, userRole);

      res.json({
        message: result.message
      });
    } catch (error) {
      console.error('Erreur suppression POI:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: "Le point d'intérêt demandé n'existe pas"
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Accès refusé',
          status: 403,
          detail: error.message
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de suppression',
        status: 500,
        detail: 'Une erreur est survenue lors de la suppression'
      });
    }
  }

  // GET /api/poi/:id/stats - Obtenir les statistiques d'un POI
  static async getPoiStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await POIService.getPoiStats(id);

      res.json({
        data: stats
      });
    } catch (error) {
      console.error('Erreur stats POI:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: "Le point d'intérêt demandé n'existe pas"
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur statistiques',
        status: 500,
        detail: 'Une erreur est survenue lors de la récupération des statistiques'
      });
    }
  }

  // POST /api/poi/:id/upload-images - Upload d'images pour un POI existant
  static async uploadImages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const imageFiles = req.files || [];

      if (imageFiles.length === 0) {
        return res.status(400).json({
          type: 'https://httpstatuses.com/400',
          title: 'Aucune image',
          status: 400,
          detail: "Aucune image n'a été fournie"
        });
      }

      // Vérifier que le POI existe et que l'utilisateur a les permissions
      const poi = await POIService.getPOIById(id);
      const canEdit =
        userRole === 'admin' ||
        userRole === 'superadmin' ||
        userRole === 'moderateur' ||
        poi.created_by === userId;

      if (!canEdit) {
        return res.status(403).json({
          type: 'https://httpstatuses.com/403',
          title: 'Accès refusé',
          status: 403,
          detail: "Vous n'avez pas la permission de modifier ce POI"
        });
      }

      // Traiter les images
      const processedImages = await POIService.processPoiImages(id, imageFiles);

      // Mettre à jour l'image principale si ce n'était pas déjà fait
      if (!poi.image && processedImages.length > 0) {
        await POIService.updatePOI(id, { image: processedImages[0].filename }, userId, userRole);
      }

      res.json({
        message: 'Images uploadées avec succès',
        data: {
          poi_id: id,
          images: processedImages
        }
      });
    } catch (error) {
      console.error('Erreur upload images:', error);

      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          type: 'https://httpstatuses.com/404',
          title: 'POI non trouvé',
          status: 404,
          detail: "Le point d'intérêt demandé n'existe pas"
        });
      }

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur upload',
        status: 500,
        detail: "Une erreur est survenue lors de l'upload des images"
      });
    }
  }

  static async searchPOIAdvanced(req, res) {
    try {
      const filters = req.query;
      const result = await POIService.searchPOIAdvanced(filters);

      res.json({
        message: 'Recherche avancée effectuée avec succès',
        data: result.data,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      console.error('Erreur recherche POI avancée:', error);

      res.status(500).json({
        type: 'https://httpstatuses.com/500',
        title: 'Erreur de recherche',
        status: 500,
        detail: 'Une erreur est survenue lors de la recherche avancée'
      });
    }
  }
}

module.exports = POIController;
