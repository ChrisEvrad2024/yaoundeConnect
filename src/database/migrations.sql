-- Créer la base de données
CREATE DATABASE IF NOT EXISTS yaounde_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yaounde_connect;

-- Modifications aux tables existantes
ALTER TABLE users 
ADD COLUMN role ENUM('membre', 'collecteur', 'moderateur', 'admin', 'superadmin') DEFAULT 'membre',
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255) NULL,
ADD COLUMN email_verification_expires TIMESTAMP NULL;

-- Modifications point_interests
ALTER TABLE point_interests 
ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN created_by BIGINT UNSIGNED NOT NULL,
ADD COLUMN approved_by BIGINT UNSIGNED NULL,
ADD COLUMN rating DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Ajouter les contraintes de clés étrangères
ALTER TABLE point_interests 
ADD CONSTRAINT fk_poi_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_poi_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);

-- Table des commentaires
CREATE TABLE comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    poi_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (poi_id) REFERENCES point_interests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des évaluations
CREATE TABLE ratings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    poi_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_poi (user_id, poi_id),
    FOREIGN KEY (poi_id) REFERENCES point_interests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des favoris (relation many-to-many User <-> POI)
CREATE TABLE favorites (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    poi_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_poi_favorite (user_id, poi_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (poi_id) REFERENCES point_interests(id) ON DELETE CASCADE
);

-- Table d'audit pour l'historique
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    record_id BIGINT UNSIGNED NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour optimiser les performances
CREATE INDEX idx_poi_location ON point_interests(latitude, longitude);
CREATE INDEX idx_poi_quartier ON point_interests(quartier_id);
CREATE INDEX idx_poi_status ON point_interests(status);
CREATE INDEX idx_comments_poi ON comments(poi_id);
CREATE INDEX idx_ratings_poi ON ratings(poi_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_poi ON favorites(poi_id);