// src/services/poiService.js

const { PointInterest, Category, Quartier, Town, User, Favorite } = require('../models');
const { Op } = require('sequelize');
const GeoService = require('./geoService');
const ImageService = require('./imageService');
const OSMService = require('./osmService');
const PaginationService = require('./paginationService');

class POIService {
  static async createPOI(data, userId, imageFiles = []) {
    try {
      console.log(' Début création POI, userId:', userId);
      console.log(' Données reçues:', data);
      console.log(' Fichiers image:', imageFiles);

      // Valider les coordonnées
      const coordValidation = GeoService.validateCoordinates(data.latitude, data.longitude);
      if (!coordValidation.valid) {
        throw new Error(coordValidation.error);
      }

      // Vérifier que le quartier existe
      const quartier = await Quartier.findByPk(data.quartier_id);
      if (!quartier) {
        throw new Error('Quartier non trouvé');
      }
      console.log('✅ Quartier trouvé:', quartier.name);

      // Vérifier que la catégorie existe
      const category = await Category.findByPk(data.category_id);
      if (!category) {
        throw new Error('Catégorie non trouvée');
      }
      console.log('✅ Catégorie trouvée:', category.name);

      // Vérifier si on est dans la zone de Yaoundé (optionnel)
      if (!GeoService.isInYaounde(data.latitude, data.longitude)) {
        console.warn(`POI créé hors de Yaoundé: ${data.latitude}, ${data.longitude}`);
      }

      // ✅ CORRECTION: Déterminer le statut selon le rôle de l'utilisateur
      let initialStatus = 'pending'; // Par défaut, en attente d'approbation

      // Récupérer l'utilisateur pour vérifier son rôle
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // ✅ Les modérateurs, admins et superadmins peuvent auto-approuver
      if (['moderateur', 'admin', 'superadmin'].includes(user.role)) {
        initialStatus = 'approved';
        console.log(`✅ Auto-approbation pour rôle: ${user.role}`);
      } else {
        console.log(`⏳ POI en attente d'approbation pour rôle: ${user.role}`);
      }

      // Préparer les données du POI
      const poiData = {
        ...data,
        user_id: userId,
        created_by: userId,
        status: initialStatus, // ✅ CORRECTION: Status selon le rôle
        is_verify: initialStatus === 'approved' ? 1 : 0, // ✅ Cohérent avec le status
        approved_by: initialStatus === 'approved' ? userId : null, // ✅ Auto-approbation si applicable
        langue: 'fr'
      };

      console.log('💾 Création POI avec données:', poiData);

      // Créer le POI
      const poi = await PointInterest.create(poiData);
      console.log(`✅ POI créé avec ID: ${poi.id}, Status: ${poi.status}`);

      // ✅ Notifier les modérateurs si POI en attente
      if (poi.status === 'pending') {
        try {
          const notificationService = require('./notificationService');
          await notificationService.notifyPOICreated(poi);
          console.log('📧 Modérateurs notifiés du nouveau POI en attente');
        } catch (notifError) {
          console.error('Erreur notification modérateurs:', notifError.message);
          // Ne pas faire échouer la création pour une erreur de notification
        }
      }

      // Traiter les images si fournies
      if (imageFiles && imageFiles.length > 0) {
        try {
          const processedImages = await this.processPoiImages(poi.id, imageFiles);

          // Mettre à jour le POI avec la première image comme image principale
          if (processedImages.length > 0) {
            await poi.update({ image: processedImages[0].filename });
          }
        } catch (imageError) {
          console.error('Erreur traitement images:', imageError);
          // Ne pas faire échouer la création pour une erreur d'image
        }
      }

      // Retourner le POI avec ses relations
      return await this.getPOIById(poi.id);
    } catch (error) {
      console.error(' Erreur création POI dans service:', error);
      throw error;
    }
  }

  // Obtenir un POI par ID avec toutes ses relations
  static async getPOIById(id, includeUser = false) {
    const includes = [
      {
        model: Category,
        attributes: ['id', 'name', 'slug', 'icon']
      },
      {
        model: Quartier,
        attributes: ['id', 'name'],
        include: [
          {
            model: Town,
            attributes: ['id', 'name']
          }
        ]
      }
    ];

    if (includeUser) {
      includes.push({
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'role']
      });
    }

    const poi = await PointInterest.findByPk(id, {
      include: includes
    });

    if (!poi) {
      throw new Error("Point d'intérêt non trouvé");
    }

    // Ajouter les URLs des images
    return this.addImageUrls(poi);
  }

  // Rechercher des POI avec filtres
  static async searchPOI(filters) {
    const {
      q,
      quartier_id,
      category_id,
      is_restaurant,
      is_transport,
      is_stadium,
      is_booking,
      is_verified,
      status,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    // Construire les conditions WHERE
    const whereConditions = {};

    // Recherche textuelle
    if (q) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { adress: { [Op.like]: `%${q}%` } }
      ];
    }

    // Filtres par champs
    if (quartier_id) whereConditions.quartier_id = quartier_id;
    if (category_id) whereConditions.category_id = category_id;
    if (is_restaurant !== undefined) whereConditions.is_restaurant = is_restaurant;
    if (is_transport !== undefined) whereConditions.is_transport = is_transport;
    if (is_stadium !== undefined) whereConditions.is_stadium = is_stadium;
    if (is_booking !== undefined) whereConditions.is_booking = is_booking;
    if (is_verified !== undefined) whereConditions.is_verify = is_verified;

    // Statut
    if (status) {
      whereConditions.status = status;
    } else {
      // Par défaut, ne montrer que les POI approuvés
      whereConditions.status = 'approved';
    }

    // Calcul pagination
    const offset = (page - 1) * limit;

    // Options de tri
    const orderOptions = [];
    if (sort_by === 'rating') {
      orderOptions.push(['rating', sort_order.toUpperCase()]);
      orderOptions.push(['rating_count', 'DESC']);
    } else {
      orderOptions.push([sort_by, sort_order.toUpperCase()]);
    }

    // Exécuter la requête
    const { count, rows } = await PointInterest.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug', 'icon']
        },
        {
          model: Quartier,
          attributes: ['id', 'name'],
          include: [
            {
              model: Town,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: orderOptions,
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    // Ajouter les URLs des images
    const poisWithImages = rows.map((poi) => this.addImageUrls(poi));

    return {
      data: poisWithImages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  // Rechercher des POI par proximité
  static async findNearbyPOI(latitude, longitude, radiusKm = 5, limit = 20) {
    try {
      // Valider les coordonnées
      const coordValidation = GeoService.validateCoordinates(latitude, longitude);
      if (!coordValidation.valid) {
        throw new Error(coordValidation.error);
      }

      // Obtenir la bounding box pour optimiser la requête
      const bbox = GeoService.getBoundingBox(latitude, longitude, radiusKm);

      // Requête avec bounding box
      const pois = await PointInterest.findAll({
        where: {
          latitude: {
            [Op.between]: [bbox.minLat, bbox.maxLat]
          },
          longitude: {
            [Op.between]: [bbox.minLon, bbox.maxLon]
          },
          status: 'approved' // Seulement les POI approuvés
        },
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'slug', 'icon']
          },
          {
            model: Quartier,
            attributes: ['id', 'name']
          }
        ],
        limit: parseInt(limit) * 2 // Récupérer plus pour filtrer ensuite
      });

      // Calculer les distances exactes et filtrer
      const poisWithDistance = pois
        .map((poi) => {
          const distance = GeoService.calculateDistance(
            latitude,
            longitude,
            poi.latitude,
            poi.longitude
          );

          return {
            ...(this.addImageUrls(poi).toJSON
              ? this.addImageUrls(poi).toJSON()
              : this.addImageUrls(poi)),
            distance: Math.round(distance * 100) / 100 // Arrondir à 2 décimales
          };
        })
        .filter((poi) => poi.distance <= radiusKm);

      // Trier par distance et limiter
      poisWithDistance.sort((a, b) => a.distance - b.distance);

      return poisWithDistance.slice(0, limit);
    } catch (error) {
      console.error('Erreur recherche proximité:', error);
      throw error;
    }
  }

  // Mettre à jour un POI
  static async updatePOI(id, data, userId, userRole) {
    try {
      const poi = await PointInterest.findByPk(id);
      if (!poi) {
        throw new Error("Point d'intérêt non trouvé");
      }

      // Vérifier les permissions
      const canEdit =
        userRole === 'admin' ||
        userRole === 'superadmin' ||
        userRole === 'moderateur' ||
        poi.created_by === userId;

      if (!canEdit) {
        throw new Error("Vous n'avez pas la permission de modifier ce POI");
      }

      // Valider les coordonnées si fournies
      if (data.latitude && data.longitude) {
        const coordValidation = GeoService.validateCoordinates(data.latitude, data.longitude);
        if (!coordValidation.valid) {
          throw new Error(coordValidation.error);
        }
      }

      // Mettre à jour
      await poi.update(data);

      // Retourner le POI mis à jour
      return await this.getPOIById(id);
    } catch (error) {
      console.error('Erreur mise à jour POI:', error);
      throw error;
    }
  }

  // Supprimer un POI
  static async deletePOI(id, userId, userRole) {
    try {
      const poi = await PointInterest.findByPk(id);
      if (!poi) {
        throw new Error("Point d'intérêt non trouvé");
      }

      // Vérifier les permissions
      const canDelete =
        userRole === 'admin' ||
        userRole === 'superadmin' ||
        userRole === 'moderateur' ||
        poi.created_by === userId;

      if (!canDelete) {
        throw new Error("Vous n'avez pas la permission de supprimer ce POI");
      }

      // Supprimer l'image si elle existe
      if (poi.image) {
        try {
          await ImageService.deleteImage(poi.image);
        } catch (imageError) {
          console.error('Erreur suppression image:', imageError);
        }
      }

      // Supprimer le POI (les relations en cascade seront supprimées)
      await poi.destroy();

      return { success: true, message: 'POI supprimé avec succès' };
    } catch (error) {
      console.error('Erreur suppression POI:', error);
      throw error;
    }
  }

  // Traiter les images d'un POI
  static async processPoiImages(poiId, imageFiles) {
    const processedImages = [];

    try {
      for (const file of imageFiles) {
        const result = await ImageService.processUploadedImage(
          file.path,
          'uploads/images/poi',
          file.originalname
        );

        processedImages.push({
          filename: result.original.filename,
          url: result.original.url,
          thumbnails: result.thumbnails
        });
      }

      return processedImages;
    } catch (error) {
      console.error('Erreur traitement images POI:', error);
      throw error;
    }
  }

  // Ajouter les URLs des images à un POI
  static addImageUrls(poi) {
    const poiData = poi.toJSON ? poi.toJSON() : poi;

    if (poiData.image) {
      poiData.imageUrls = {
        original: `/uploads/images/poi/${poiData.image}`,
        thumbnails: {
          small: `/uploads/thumbnails/small/${poiData.image}`,
          medium: `/uploads/thumbnails/medium/${poiData.image}`,
          large: `/uploads/thumbnails/large/${poiData.image}`
        }
      };
    } else {
      poiData.imageUrls = null;
    }

    return poiData;
  }

  // Vérifier si un POI est en favori pour un utilisateur
  static async checkIfFavorite(poiId, userId) {
    if (!userId) return false;

    const favorite = await Favorite.findOne({
      where: {
        poi_id: poiId,
        user_id: userId
      }
    });

    return !!favorite;
  }

  // Obtenir les statistiques d'un POI
  static async getPoiStats(id) {
    const poi = await PointInterest.findByPk(id);
    if (!poi) {
      throw new Error('POI non trouvé');
    }

    // Compter les favoris
    const favoritesCount = await Favorite.count({
      where: { poi_id: id }
    });

    return {
      id: poi.id,
      name: poi.name,
      rating: poi.rating,
      rating_count: poi.rating_count,
      favorites_count: favoritesCount,
      created_at: poi.created_at,
      is_verified: poi.is_verify
    };
  }

  // Recherche avancée avec pagination cursor
  static async searchPOIAdvanced(filters = {}) {
    const { cursor, useCursor = false, ...searchFilters } = filters;

    try {
      // Construire les conditions WHERE
      const whereConditions = this.buildSearchConditions(searchFilters);

      // Relations à inclure
      const include = [
        {
          model: Category,
          attributes: ['id', 'name', 'slug', 'icon']
        },
        {
          model: Quartier,
          attributes: ['id', 'name'],
          include: [
            {
              model: Town,
              attributes: ['id', 'name']
            }
          ]
        }
      ];

      // Utiliser la pagination appropriée
      const paginationOptions = {
        ...filters,
        where: whereConditions,
        include,
        model: PointInterest
      };

      const result = useCursor
        ? await PaginationService.cursorPaginate(PointInterest, paginationOptions)
        : await PaginationService.offsetPaginate(PointInterest, paginationOptions);

      // Ajouter les URLs des images
      result.data = result.data.map((poi) => this.addImageUrls(poi));

      return result;
    } catch (error) {
      console.error('❌ Erreur recherche POI avancée:', error);
      throw error;
    }
  }

  // Helper pour construire les conditions de recherche
  static buildSearchConditions(filters) {
    const {
      q,
      quartier_id,
      category_id,
      is_restaurant,
      is_transport,
      is_stadium,
      is_booking,
      is_verified,
      status
    } = filters;

    const whereConditions = {};

    // Recherche textuelle
    if (q) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { adress: { [Op.like]: `%${q}%` } }
      ];
    }

    // Filtres par champs
    if (quartier_id) whereConditions.quartier_id = quartier_id;
    if (category_id) whereConditions.category_id = category_id;
    if (is_restaurant !== undefined) whereConditions.is_restaurant = is_restaurant;
    if (is_transport !== undefined) whereConditions.is_transport = is_transport;
    if (is_stadium !== undefined) whereConditions.is_stadium = is_stadium;
    if (is_booking !== undefined) whereConditions.is_booking = is_booking;
    if (is_verified !== undefined) whereConditions.is_verify = is_verified;

    // Statut
    if (status) {
      whereConditions.status = status;
    } else {
      // Par défaut, ne montrer que les POI approuvés
      whereConditions.status = 'approved';
    }

    return whereConditions;
  }
}

module.exports = POIService;
