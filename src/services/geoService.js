class GeoService {
  // Calculer la distance entre deux points (formule de Haversine)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  // Convertir degrés en radians
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Générer une bounding box pour optimiser les requêtes
  static getBoundingBox(latitude, longitude, radiusKm) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    // Approximation rapide (suffisante pour de petites distances)
    const latDelta = radius / 111.32; // 1 degré ≈ 111.32 km
    const lonDelta = radius / (111.32 * Math.cos(this.toRadians(lat)));

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLon: lon - lonDelta,
      maxLon: lon + lonDelta
    };
  }

  // Valider des coordonnées GPS
  static validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return { valid: false, error: 'Coordonnées invalides' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude doit être entre -90 et 90' };
    }

    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude doit être entre -180 et 180' };
    }

    return { valid: true, latitude: lat, longitude: lon };
  }

  // Vérifier si un point est dans Yaoundé (zone approximative)
  static isInYaounde(latitude, longitude) {
    const yaoundeCenter = { lat: 3.848, lon: 11.5021 };
    const yaoundeRadius = 25; // 25km de rayon

    const distance = this.calculateDistance(
      yaoundeCenter.lat,
      yaoundeCenter.lon,
      latitude,
      longitude
    );

    return distance <= yaoundeRadius;
  }

  // Formater une adresse pour géocodage (future intégration)
  static formatAddressForGeocoding(adress, quartier, town = 'Yaoundé', country = 'Cameroun') {
    return `${adress}, ${quartier}, ${town}, ${country}`;
  }
}

module.exports = GeoService;
