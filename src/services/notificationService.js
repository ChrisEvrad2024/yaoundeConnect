const { Server } = require('socket.io');
const emailService = require('./emailService');

class NotificationService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
    }

    // Initialiser Socket.IO
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`📡 Nouvelle connexion Socket.IO: ${socket.id}`);

            // Authentification du socket
            socket.on('authenticate', (token) => {
                try {
                    const AuthService = require('./authService');
                    const decoded = AuthService.verifyToken(token);
                    
                    socket.userId = decoded.id;
                    socket.userRole = decoded.role;
                    this.connectedUsers.set(decoded.id, socket.id);
                    
                    // Rejoindre les salles appropriées selon le rôle
                    if (['moderateur', 'admin', 'superadmin'].includes(decoded.role)) {
                        socket.join('moderators');
                    }
                    
                    socket.emit('authenticated', { userId: decoded.id, role: decoded.role });
                    console.log(`✅ Socket authentifié: User ${decoded.id} (${decoded.role})`);
                    
                } catch (error) {
                    console.error('❌ Erreur auth socket:', error.message);
                    socket.emit('auth_error', { message: 'Token invalide' });
                }
            });

            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.connectedUsers.delete(socket.userId);
                    console.log(`📡 Déconnexion: User ${socket.userId}`);
                }
            });
        });

        console.log('🚀 Service de notifications initialisé');
    }

    // Notifier l'approbation d'un POI
    async notifyPOIApproval(data) {
        const { poi, moderator_id, comments } = data;
        
        try {
            // Notification temps réel au créateur
            const creatorSocketId = this.connectedUsers.get(poi.created_by);
            if (creatorSocketId) {
                this.io.to(creatorSocketId).emit('poi:approved', {
                    type: 'poi_approved',
                    poi_id: poi.id,
                    poi_name: poi.name,
                    moderator_id,
                    comments,
                    timestamp: new Date().toISOString()
                });
            }

            // Notification email au créateur
            if (poi.creator && poi.creator.email) {
                await this.sendApprovalEmail(poi, comments);
            }

            // Notifier les autres modérateurs
            this.io.to('moderators').emit('poi:moderated', {
                type: 'poi_approved',
                poi_id: poi.id,
                poi_name: poi.name,
                action: 'approved',
                moderator_id,
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notifications envoyées pour approbation POI ${poi.id}`);

        } catch (error) {
            console.error('❌ Erreur notification approbation:', error);
        }
    }

    // Notifier le rejet d'un POI
    async notifyPOIRejection(data) {
        const { poi, moderator_id, reason } = data;
        
        try {
            // Notification temps réel au créateur
            const creatorSocketId = this.connectedUsers.get(poi.created_by);
            if (creatorSocketId) {
                this.io.to(creatorSocketId).emit('poi:rejected', {
                    type: 'poi_rejected',
                    poi_id: poi.id,
                    poi_name: poi.name,
                    moderator_id,
                    reason,
                    timestamp: new Date().toISOString()
                });
            }

            // Notification email au créateur
            if (poi.creator && poi.creator.email) {
                await this.sendRejectionEmail(poi, reason);
            }

            // Notifier les autres modérateurs
            this.io.to('moderators').emit('poi:moderated', {
                type: 'poi_rejected',
                poi_id: poi.id,
                poi_name: poi.name,
                action: 'rejected',
                moderator_id,
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notifications envoyées pour rejet POI ${poi.id}`);

        } catch (error) {
            console.error('❌ Erreur notification rejet:', error);
        }
    }
     // Notifier la création d'un nouveau POI aux modérateurs
    async notifyPOICreated(poi) {
        try {
            this.io.to('moderators').emit('poi:created', {
                type: 'new_poi_pending',
                poi_id: poi.id,
                poi_name: poi.name,
                creator_id: poi.created_by,
                quartier: poi.Quartier?.name,
                category: poi.Category?.name,
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Modérateurs notifiés pour nouveau POI ${poi.id}`);

        } catch (error) {
            console.error('❌ Erreur notification création POI:', error);
        }
    }

    // Email d'approbation
    async sendApprovalEmail(poi, comments) {
        const subject = `✅ Votre POI "${poi.name}" a été approuvé !`;
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .poi-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 POI Approuvé !</h1>
                </div>
                <div class="content">
                    <h2>Excellente nouvelle !</h2>
                    <p>Votre point d'intérêt a été approuvé par notre équipe de modération et est maintenant visible publiquement.</p>
                    
                    <div class="poi-info">
                        <h3>📍 ${poi.name}</h3>
                        <p><strong>Adresse :</strong> ${poi.adress}</p>
                        <p><strong>Description :</strong> ${poi.description.substring(0, 100)}...</p>
                        ${comments ? `<p><strong>Commentaires du modérateur :</strong> ${comments}</p>` : ''}
                    </div>
                    
                    <p>Merci de contribuer à enrichir notre plateforme yaoundeConnect !</p>
                </div>
                <div class="footer">
                    <p>© 2025 yaoundeConnect. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>`;

        return await emailService.sendEmail(poi.creator.email, subject, html);
    }

    // Email de rejet
    async sendRejectionEmail(poi, reason) {
        const subject = `❌ Votre POI "${poi.name}" nécessite des modifications`;
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .poi-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .reason { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; }
                .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📝 POI à modifier</h1>
                </div>
                <div class="content">
                    <h2>Votre POI nécessite des modifications</h2>
                    <p>Notre équipe de modération a examiné votre point d'intérêt mais a identifié quelques points à améliorer.</p>
                    
                    <div class="poi-info">
                        <h3>📍 ${poi.name}</h3>
                        <p><strong>Adresse :</strong> ${poi.adress}</p>
                    </div>
                    
                    <div class="reason">
                        <h4>🔍 Raison du rejet :</h4>
                        <p>${reason}</p>
                    </div>
                    
                    <p>Vous pouvez modifier votre POI et le soumettre à nouveau pour approbation. Merci de votre compréhension !</p>
                </div>
                <div class="footer">
                    <p>© 2025 yaoundeConnect. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>`;

        return await emailService.sendEmail(poi.creator.email, subject, html);
    }
}

// Instance singleton
const notificationService = new NotificationService();
module.exports = notificationService;
