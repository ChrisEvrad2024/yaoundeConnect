const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { thumbnailSizes } = require('../config/upload');

class ImageService {

    // Traiter et optimiser une image
    static async processImage(inputPath, outputDir, filename) {
        try {
            const outputPath = path.join(outputDir, filename);

            // Optimiser l'image principale
            await sharp(inputPath)
                .resize(800, 600, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 80,
                    progressive: true
                })
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath,
                filename: filename
            };

        } catch (error) {
            console.error('Erreur traitement image:', error);
            throw new Error(`Erreur lors du traitement de l'image: ${error.message}`);
        }
    }

    // Générer les thumbnails
    static async generateThumbnails(inputPath, baseFilename) {
        const thumbnails = {};

        try {
            for (const [size, dimensions] of Object.entries(thumbnailSizes)) {
                const thumbnailDir = `uploads/thumbnails/${size}`;
                const thumbnailPath = path.join(thumbnailDir, baseFilename);

                await sharp(inputPath)
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 75 })
                    .toFile(thumbnailPath);

                thumbnails[size] = {
                    path: thumbnailPath,
                    url: `/uploads/thumbnails/${size}/${baseFilename}`,
                    width: dimensions.width,
                    height: dimensions.height
                };
            }

            return thumbnails;

        } catch (error) {
            console.error('Erreur génération thumbnails:', error);
            throw new Error(`Erreur lors de la génération des thumbnails: ${error.message}`);
        }
    }

    // Traitement complet d'une image uploadée
    static async processUploadedImage(tempPath, finalDir, baseFilename) {
        try {
            // Générer le nom de fichier final
            const timestamp = Date.now();
            const ext = path.extname(baseFilename);
            const name = path.basename(baseFilename, ext);
            const finalFilename = `${name}-${timestamp}.jpg`; // Toujours convertir en JPEG

            // Traiter l'image principale
            const processedImage = await this.processImage(
                tempPath,
                finalDir,
                finalFilename
            );

            // Générer les thumbnails
            const thumbnails = await this.generateThumbnails(
                processedImage.path,
                finalFilename
            );

            // Supprimer le fichier temporaire
            await fs.unlink(tempPath);

            return {
                original: {
                    path: processedImage.path,
                    url: `/uploads/images/poi/${finalFilename}`,
                    filename: finalFilename
                },
                thumbnails
            };

        } catch (error) {
            // Nettoyer le fichier temporaire en cas d'erreur
            try {
                await fs.unlink(tempPath);
            } catch (cleanupError) {
                console.error('Erreur nettoyage fichier temp:', cleanupError);
            }

            throw error;
        }
    }

    // Supprimer une image et ses thumbnails
    static async deleteImage(filename) {
        try {
            const filesToDelete = [];

            // Image principale
            filesToDelete.push(`uploads/images/poi/${filename}`);

            // Thumbnails
            for (const size of Object.keys(thumbnailSizes)) {
                filesToDelete.push(`uploads/thumbnails/${size}/${filename}`);
            }

            // Supprimer tous les fichiers
            for (const filePath of filesToDelete) {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    // Ignorer si le fichier n'existe pas
                    if (error.code !== 'ENOENT') {
                        console.error(`Erreur suppression ${filePath}:`, error);
                    }
                }
            }

            return { success: true };

        } catch (error) {
            console.error('Erreur suppression image:', error);
            throw new Error(`Erreur lors de la suppression de l'image: ${error.message}`);
        }
    }

    // Obtenir les informations d'une image
    static async getImageInfo(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = await fs.stat(imagePath);

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                density: metadata.density
            };

        } catch (error) {
            throw new Error(`Erreur lecture métadonnées image: ${error.message}`);
        }
    }
}

module.exports = ImageService;