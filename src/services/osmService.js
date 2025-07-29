const axios = require('axios');
const GeoService = require('./geoService');

class OSMService {
  constructor() {
    this.baseURL = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'yaoundeConnect/1.0 (contact@yaoundeconnect.com)';

    // Cache simple en mémoire (en production, utilisez Redis)
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24h
  }

  // Géocoder une adresse (adresse -> coordonnées)
  async geocodeAddress(address, city = 'Yaoundé', country = 'Cameroun') {
    const fullAddress = `${address}, ${city}, ${country}`;
    const cacheKey = `geocode:${fullAddress.toLowerCase()}`;

    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📍 Géocodage depuis cache:', fullAddress);
        return cached.data;
      }
    }

    try {
      console.log('📍 Géocodage OSM:', fullAddress);

      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 5,
          countrycodes: 'cm',
          addressdetails: 1,
          extratags: 1
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000 // 10s timeout
      });

      const results = response.data || [];

      if (results.length === 0) {
        return {
          success: false,
          error: 'Adresse non trouvée sur OpenStreetMap',
          suggestions: []
        };
      }

      // Filtrer les résultats pour Yaoundé
      const yaoundeResults = results.filter((result) => {
        const isInYaounde = this.isResultInYaounde(result);
        return isInYaounde;
      });

      const processedResults = yaoundeResults.map((result) => ({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        formatted_address: this.formatOSMAddress(result),
        confidence: this.calculateConfidence(result, fullAddress),
        osm_id: result.osm_id,
        osm_type: result.osm_type,
        place_rank: result.place_rank,
        address_details: result.address || {}
      }));

      // Trier par confiance
      processedResults.sort((a, b) => b.confidence - a.confidence);

      const result = {
        success: true,
        results: processedResults,
        best_match: processedResults[0] || null,
        query: fullAddress
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur géocodage OSM:', error.message);

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Timeout lors du géocodage - service OSM indisponible',
          suggestions: []
        };
      }

      return {
        success: false,
        error: "Erreur lors du géocodage de l'adresse",
        suggestions: []
      };
    }
  }

  // Géocodage inverse (coordonnées -> adresse)
  async reverseGeocode(latitude, longitude) {
    const cacheKey = `reverse:${latitude},${longitude}`;

    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📍 Géocodage inverse depuis cache');
        return cached.data;
      }
    }

    try {
      console.log(`📍 Géocodage inverse OSM: ${latitude}, ${longitude}`);

      const response = await axios.get(`${this.baseURL}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          zoom: 18 // Niveau de détail maximum
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      const data = response.data;

      if (!data || !data.address) {
        return {
          success: false,
          error: 'Aucune adresse trouvée pour ces coordonnées'
        };
      }

      const result = {
        success: true,
        formatted_address: this.formatOSMAddress(data),
        display_name: data.display_name,
        address_components: data.address,
        osm_id: data.osm_id,
        osm_type: data.osm_type,
        place_rank: data.place_rank,
        coordinates: {
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon)
        }
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur géocodage inverse OSM:', error.message);
      return {
        success: false,
        error: 'Erreur lors du géocodage inverse'
      };
    }
  }

  // Valider une adresse existante
  async validateAddress(address, latitude, longitude) {
    try {
      // 1. Géocoder l'adresse
      const geocodeResult = await this.geocodeAddress(address);

      if (!geocodeResult.success || !geocodeResult.best_match) {
        return {
          valid: false,
          error: 'Adresse non trouvée sur OpenStreetMap',
          suggestions: geocodeResult.results || []
        };
      }

      // 2. Calculer la distance entre coordonnées fournies et géocodées
      const bestMatch = geocodeResult.best_match;
      const distance = GeoService.calculateDistance(
        latitude,
        longitude,
        bestMatch.latitude,
        bestMatch.longitude
      );

      // 3. Vérifier la cohérence (tolérance de 500m)
      const tolerance = 0.5; // 500m
      const isCoherent = distance <= tolerance;

      return {
        valid: isCoherent,
        distance_km: Math.round(distance * 1000) / 1000,
        tolerance_km: tolerance,
        geocoded_address: bestMatch.formatted_address,
        geocoded_coordinates: {
          latitude: bestMatch.latitude,
          longitude: bestMatch.longitude
        },
        confidence: bestMatch.confidence,
        suggestions: geocodeResult.results.slice(0, 3)
      };
    } catch (error) {
      console.error('❌ Erreur validation adresse:', error);
      return {
        valid: false,
        error: "Erreur lors de la validation de l'adresse"
      };
    }
  }

  // Rechercher des POI proches sur OSM
  async findNearbyOSMPOIs(latitude, longitude, radius = 1, category = null) {
    try {
      const bbox = GeoService.getBoundingBox(latitude, longitude, radius);

      // Construire la requête Overpass API pour plus de précision
      const overpassQuery = this.buildOverpassQuery(bbox, category);

      const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': this.userAgent
        },
        timeout: 15000
      });

      const osmPOIs = this.parseOverpassResponse(response.data, latitude, longitude);

      return {
        success: true,
        pois: osmPOIs,
        center: { latitude, longitude },
        radius,
        total: osmPOIs.length
      };
    } catch (error) {
      console.error('❌ Erreur recherche POI OSM:', error.message);
      return {
        success: false,
        error: 'Erreur lors de la recherche de POI sur OpenStreetMap',
        pois: []
      };
    }
  }

  // Helpers privés
  isResultInYaounde(result) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Vérifier avec notre service géo
    return GeoService.isInYaounde(lat, lon);
  }

  formatOSMAddress(osmResult) {
    const addr = osmResult.address || {};
    const parts = [];

    // Numéro + rue
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }

    // Quartier
    if (addr.suburb) {
      parts.push(addr.suburb);
    } else if (addr.neighbourhood) {
      parts.push(addr.neighbourhood);
    }

    // Ville
    if (addr.city) {
      parts.push(addr.city);
    } else if (addr.town) {
      parts.push(addr.town);
    }

    return parts.length > 0 ? parts.join(', ') : osmResult.display_name;
  }

  calculateConfidence(result, originalQuery) {
    let confidence = 0.5; // Base

    // Bonus pour place_rank (plus bas = plus précis)
    if (result.place_rank <= 20) confidence += 0.3;
    else if (result.place_rank <= 25) confidence += 0.2;
    else if (result.place_rank <= 30) confidence += 0.1;

    // Bonus si l'adresse contient des éléments de la requête
    const queryWords = originalQuery.toLowerCase().split(/\s+/);
    const displayName = result.display_name.toLowerCase();

    const matchedWords = queryWords.filter((word) => word.length > 2 && displayName.includes(word));

    confidence += (matchedWords.length / queryWords.length) * 0.2;

    return Math.min(confidence, 1.0);
  }

  buildOverpassQuery(bbox, category) {
    const { minLat, maxLat, minLon, maxLon } = bbox;

    let amenityFilter = '';
    if (category === 'restaurant') {
      amenityFilter = '["amenity"~"restaurant|cafe|fast_food|bar"]';
    } else if (category === 'transport') {
      amenityFilter = '["amenity"~"bus_station|taxi"]';
    } else if (category === 'tourism') {
      amenityFilter = '["tourism"~"attraction|museum|hotel"]';
    } else {
      amenityFilter = '["amenity"]';
    }

    return `
        [out:json][timeout:25];
        (
          node${amenityFilter}(${minLat},${minLon},${maxLat},${maxLon});
          way${amenityFilter}(${minLat},${minLon},${maxLat},${maxLon});
        );
        out center meta;
        `;
  }

  parseOverpassResponse(data, centerLat, centerLon) {
    const elements = data.elements || [];

    return elements
      .map((element) => {
        const lat = element.lat || (element.center ? element.center.lat : null);
        const lon = element.lon || (element.center ? element.center.lon : null);

        if (!lat || !lon) return null;

        const distance = GeoService.calculateDistance(centerLat, centerLon, lat, lon);

        return {
          osm_id: element.id,
          osm_type: element.type,
          name: element.tags?.name || 'POI sans nom',
          amenity: element.tags?.amenity,
          latitude: lat,
          longitude: lon,
          distance_km: Math.round(distance * 1000) / 1000,
          tags: element.tags || {}
        };
      })
      .filter((poi) => poi !== null)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  // Nettoyer le cache périodiquement
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    console.log(`🧹 Cache OSM nettoyé, ${this.cache.size} entrées restantes`);
  }
}

// Instance singleton
const osmService = new OSMService();

// Nettoyage automatique du cache toutes les heures
setInterval(
  () => {
    osmService.cleanCache();
  },
  60 * 60 * 1000
);

module.exports = osmService;
