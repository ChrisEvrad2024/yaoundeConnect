const { PointInterest, Category, Quartier, Town, User, Favorite } = require('../models');
const { Op } = require('sequelize');
const GeoService = require('./geoService');
const ImageService = require('./imageService');
const OSMService = require('./osmService');
const PaginationService = require('./paginationService');

class POIService {

    // Créer un nouveau POI
    static async createPOI(data, userId, imageFiles = []) {
        try {
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

            // Vérifier que la catégorie existe
            const category = await Category.findByPk(data.category_id);
            if (!category) {
                throw new Error('Catégorie non trouvée');
            }

            // Vérifier si on est dans la zone de Yaoundé (optionnel)
            if (!GeoService.isInYaounde(data.latitude, data.longitude)) {
                console.warn(`POI créé hors de Yaoundé: ${data.latitude}, ${data.longitude}`);
            }

            // Préparer les données du POI
            const poiData = {
                ...data,
                user_id: userId,
                created_by: userId,
                status: 1, // Statut actif
                is_verify: 0, // Non vérifié par défaut
                langue: 'fr'
            };

            // Créer le POI
            const poi = await PointInterest.create(poiData);

            // Traiter les images si fournies
            if (imageFiles && imageFiles.length > 0) {
                const processedImages = await this.processPoiImages(poi.id, imageFiles);

                // Mettre à jour le POI avec la première image comme image principale
                if (processedImages.length > 0) {
                    await poi.update({ image: processedImages[0].filename });
                }
            }

            // Retourner le POI avec ses relations
            return await this.getPOIById(poi.id);

        } catch (error) {
            console.error('Erreur création POI:', error);
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
                include: [{
                    model: Town,
                    attributes: ['id', 'name']
                }]
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
            throw new Error('Point d\'intérêt non trouvé');
        }

        // Ajouter les URLs des images
        return this.addImageUrls(poi);
    }

    // Rechercher des POI avec filtres
    static async searchPOI(filters) {
        const {
            q, // Recherche textuelle
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

        // Statut (pour les administrateurs)
        if (status) {
            if (status === 'approved') whereConditions.status = 1;
            else if (status === 'pending') whereConditions.status = 0;
            else if (status === 'rejected') whereConditions.status = -1;
        } else {
            // Par défaut, ne montrer que les POI approuvés
            whereConditions.status = 1;
        }

        // Calcul pagination
        const offset = (page - 1) * limit;

        // Options de tri
        const orderOptions = [];
        if (sort_by === 'rating') {
            orderOptions.push(['rating', sort_order.toUpperCase()]);
            orderOptions.push(['rating_count', 'DESC']); // Puis par nombre de notes
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
                    include: [{
                        model: Town,
                        attributes: ['id', 'name']
                    }]
                }
            ],
            order: orderOptions,
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        // Ajouter les URLs des images
        const poisWithImages = rows.map(poi => this.addImageUrls(poi));

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
                    status: 1 // Seulement les POI approuvés
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
            const poisWithDistance = pois.map(poi => {
                const distance = GeoService.calculateDistance(
                    latitude,
                    longitude,
                    poi.latitude,
                    poi.longitude
                );

                return {
                    ...this.addImageUrls(poi).toJSON(),
                    distance: Math.round(distance * 100) / 100 // Arrondir à 2 décimales
                };
            }).filter(poi => poi.distance <= radiusKm);

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
                throw new Error('Point d\'intérêt non trouvé');
            }

            // Vérifier les permissions
            const canEdit = userRole === 'admin' ||
                userRole === 'superadmin' ||
                userRole === 'moderateur' ||
                poi.created_by === userId;

            if (!canEdit) {
                throw new Error('Vous n\'avez pas la permission de modifier ce POI');
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
                throw new Error('Point d\'intérêt non trouvé');
            }

            // Vérifier les permissions
            const canDelete = userRole === 'admin' ||
                userRole === 'superadmin' ||
                userRole === 'moderateur' ||
                poi.created_by === userId;

            if (!canDelete) {
                throw new Error('Vous n\'avez pas la permission de supprimer ce POI');
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

    // Valider une adresse avec OSM lors de la création
    static async validatePOIAddress(adress, latitude, longitude) {
        try {
            const validation = await OSMService.validateAddress(adress, latitude, longitude);

            if (!validation.valid) {
                console.warn(`⚠️ Adresse potentiellement incorrecte: ${adress}`);
                console.warn(`   Distance: ${validation.distance_km}km`);
                console.warn(`   Suggestions: ${validation.suggestions?.map(s => s.formatted_address).join(', ')}`);
            }

            return validation;
        } catch (error) {
            console.error('❌ Erreur validation adresse OSM:', error);
            // Ne pas faire échouer la création pour une erreur de validation
            return { valid: true, warning: 'Validation OSM indisponible' };
        }
    }

    // Enrichir un POI avec des données OSM
    static async enrichPOIWithOSM(poi) {
        try {
            // Géocodage inverse pour obtenir des détails d'adresse
            const reverseResult = await OSMService.reverseGeocode(poi.latitude, poi.longitude);

            if (reverseResult.success) {
                poi.osm_data = {
                    formatted_address: reverseResult.formatted_address,
                    address_components: reverseResult.address_components,
                    osm_id: reverseResult.osm_id
                };
            }

            // Rechercher des POI similaires à proximité
            const nearbyOSMPOIs = await OSMService.findNearbyOSMPOIs(
                poi.latitude,
                poi.longitude,
                0.5, // 500m de rayon
                poi.Category?.slug
            );

            if (nearbyOSMPOIs.success) {
                poi.nearby_osm_pois = nearbyOSMPOIs.pois.slice(0, 5);
            }

            return poi;

        } catch (error) {
            console.error('❌ Erreur enrichissement OSM:', error);
            return poi; // Retourner le POI original en cas d'erreur
        }
    }

    // Recherche améliorée avec pagination cursor
    static async searchPOIAdvanced(filters = {}) {
        const {
            cursor,
            useCursor = false,
            ...searchFilters
        } = filters;

        try {
            // Construire les conditions WHERE
            const whereConditions = this.buildSearchConditions(searchFilters);

            // Relations à inclure
            const include = [
                {
                    model: require('../models').Category,
                    attributes: ['id', 'name', 'slug', 'icon']
                },
                {
                    model: require('../models').Quartier,
                    attributes: ['id', 'name'],
                    include: [{
                        model: require('../models').Town,
                        attributes: ['id', 'name']
                    }]
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
            result.data = result.data.map(poi => this.addImageUrls(poi));

            return result;

        } catch (error) {
            console.error('❌ Erreur recherche POI avancée:', error);
            throw error;
        }
    }

    // Helper pour construire les conditions de recherche
    static buildSearchConditions(filters) {
        const {
            q, quartier_id, category_id, is_restaurant, is_transport,
            is_stadium, is_booking, is_verified, status
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
            if (status === 'approved') whereConditions.status = 'approved';
            else if (status === 'pending') whereConditions.status = 'pending';
            else if (status === 'rejected') whereConditions.status = 'rejected';
        } else {
            // Par défaut, ne montrer que les POI approuvés
            whereConditions.status = 'approved';
        }

        return whereConditions;
    }
}