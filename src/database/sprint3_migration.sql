-- Migration pour le Sprint 3 - Comments & Ratings
USE explorateur_mboa;

-- Mise à jour table comments existante
ALTER TABLE comments 
ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER user_id,
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE AFTER moderated_by,
ADD COLUMN edited_at TIMESTAMP NULL AFTER is_edited,
ADD COLUMN likes_count INTEGER DEFAULT 0 AFTER edited_at,
ADD COLUMN reports_count INTEGER DEFAULT 0 AFTER likes_count,
MODIFY status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'approved',
ADD CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Table des likes de commentaires
CREATE TABLE comment_likes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    comment_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment_user_like (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des signalements de commentaires
CREATE TABLE comment_reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    comment_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    reason ENUM('spam', 'inappropriate', 'harassment', 'misinformation', 'other') NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
    reviewed_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour optimiser les performances
CREATE INDEX idx_comments_poi_status ON comments(poi_id, status);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);

-- Mise à jour table ratings existante (si elle existe)
CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    poi_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_poi_rating (user_id, poi_id),
    FOREIGN KEY (poi_id) REFERENCES point_interests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour optimiser les calculs de moyennes
CREATE INDEX idx_ratings_poi ON ratings(poi_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);