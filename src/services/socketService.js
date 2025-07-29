// src/services/socketService.js
const { Server } = require('socket.io');
const AuthService = require('./authService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> {socketId, userInfo, joinedAt}
    this.userSockets = new Map(); // socketId -> userId
    this.rooms = new Map(); // roomName -> Set(userIds)
    this.statistics = {
      totalConnections: 0,
      currentConnected: 0,
      peakConnections: 0,
      messagesSent: 0,
      startTime: new Date()
    };
  }

  // ====================================================================
  // 🚀 INITIALISATION DU SERVICE
  // ====================================================================

  init(server) {
    console.log('🔌 Initialisation du service Socket.IO...');

    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_URL || 'http://localhost:3000',
          'http://localhost:10000',
          'http://localhost:4200',
          'http://localhost:8080'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    this.setupPeriodicTasks();

    console.log('✅ Service Socket.IO initialisé avec succès');
    return this.io;
  }

  // ====================================================================
  // 🎯 CONFIGURATION DES ÉVÉNEMENTS PRINCIPAUX
  // ====================================================================

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const connectionTime = new Date();
    this.statistics.totalConnections++;
    this.statistics.currentConnected++;

    // Mettre à jour le pic de connexions
    if (this.statistics.currentConnected > this.statistics.peakConnections) {
      this.statistics.peakConnections = this.statistics.currentConnected;
    }

    console.log(
      `🔌 Nouvelle connexion Socket.IO: ${socket.id} [${this.statistics.currentConnected} connectés]`
    );

    // ====================================================================
    // 🔐 AUTHENTIFICATION
    // ====================================================================

    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // ====================================================================
    // 📍 ÉVÉNEMENTS POI
    // ====================================================================

    socket.on('poi:subscribe', (poiId) => {
      this.handlePOISubscription(socket, poiId);
    });

    socket.on('poi:unsubscribe', (poiId) => {
      this.handlePOIUnsubscription(socket, poiId);
    });

    socket.on('poi:view', (poiId) => {
      this.handlePOIView(socket, poiId);
    });

    // ====================================================================
    // 💬 ÉVÉNEMENTS COMMENTAIRES
    // ====================================================================

    socket.on('comment:typing', (data) => {
      this.handleCommentTyping(socket, data);
    });

    socket.on('comment:stop_typing', (data) => {
      this.handleCommentStopTyping(socket, data);
    });

    // ====================================================================
    // 👥 ÉVÉNEMENTS UTILISATEURS
    // ====================================================================

    socket.on('user:get_online', () => {
      this.handleGetOnlineUsers(socket);
    });

    socket.on('user:subscribe_to_updates', (userId) => {
      this.handleUserUpdatesSubscription(socket, userId);
    });

    // ====================================================================
    // 🏛️ ÉVÉNEMENTS MODÉRATION
    // ====================================================================

    socket.on('moderation:subscribe', () => {
      this.handleModerationSubscription(socket);
    });

    socket.on('moderation:get_pending_count', () => {
      this.handleGetPendingCount(socket);
    });

    // ====================================================================
    // 📊 ÉVÉNEMENTS ANALYTICS
    // ====================================================================

    socket.on('analytics:page_view', (data) => {
      this.handlePageView(socket, data);
    });

    socket.on('analytics:poi_interaction', (data) => {
      this.handlePOIInteraction(socket, data);
    });

    // ====================================================================
    // 🔧 ÉVÉNEMENTS SYSTÈME
    // ====================================================================

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('get_server_info', () => {
      this.handleGetServerInfo(socket);
    });

    // ====================================================================
    // 🚪 DÉCONNEXION
    // ====================================================================

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason, connectionTime);
    });

    // ====================================================================
    // ❌ GESTION D'ERREURS
    // ====================================================================

    socket.on('error', (error) => {
      console.error(`❌ Erreur Socket ${socket.id}:`, error);
    });

    // Envoyer les informations de connexion initiales
    socket.emit('connected', {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
      connectedUsers: this.statistics.currentConnected
    });
  }

  // ====================================================================
  // 🔐 GESTION DE L'AUTHENTIFICATION
  // ====================================================================

  async handleAuthentication(socket, data) {
    try {
      const { token, userInfo } = data;

      if (!token) {
        socket.emit('auth_error', { message: 'Token manquant' });
        return;
      }

      // Vérifier le token JWT
      const decoded = AuthService.verifyToken(token);

      // Récupérer les infos utilisateur depuis la base
      const { User } = require('../models');
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role', 'is_email_verified']
      });

      if (!user) {
        socket.emit('auth_error', { message: 'Utilisateur non trouvé' });
        return;
      }

      if (!user.is_email_verified) {
        socket.emit('auth_error', { message: 'Email non vérifié' });
        return;
      }

      // Stocker les informations utilisateur
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        socketId: socket.id,
        joinedAt: new Date(),
        lastActivity: new Date(),
        ...userInfo
      };

      // Déconnecter l'ancien socket si l'utilisateur était déjà connecté
      if (this.connectedUsers.has(user.id)) {
        const oldSocketData = this.connectedUsers.get(user.id);
        const oldSocket = this.io.sockets.sockets.get(oldSocketData.socketId);
        if (oldSocket) {
          oldSocket.emit('force_disconnect', { reason: 'Nouvelle connexion détectée' });
          oldSocket.disconnect();
        }
      }

      // Enregistrer la nouvelle connexion
      this.connectedUsers.set(user.id, userData);
      this.userSockets.set(socket.id, user.id);

      // Assigner les propriétés au socket
      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.name;

      // Rejoindre les salles appropriées selon le rôle
      await this.assignUserToRooms(socket, user);

      // Notifier l'utilisateur de l'authentification réussie
      socket.emit('authenticated', {
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        rooms: this.getUserRooms(user),
        onlineUsers: this.getOnlineUsersForRole(user.role)
      });

      // Notifier les autres utilisateurs de la connexion
      this.broadcastUserStatusChange(user.id, 'online');

      console.log(`✅ Socket authentifié: User ${user.id} (${user.name}) - Rôle: ${user.role}`);
    } catch (error) {
      console.error('❌ Erreur authentification socket:', error.message);
      socket.emit('auth_error', { message: 'Token invalide' });
    }
  }

  // ====================================================================
  // 🏠 GESTION DES SALLES (ROOMS)
  // ====================================================================

  async assignUserToRooms(socket, user) {
    // Salle générale pour tous les utilisateurs authentifiés
    socket.join('authenticated_users');
    this.addToRoom('authenticated_users', user.id);

    // Salles par rôle
    socket.join(`role_${user.role}`);
    this.addToRoom(`role_${user.role}`, user.id);

    // Salle pour les modérateurs et plus
    if (['moderateur', 'admin', 'superadmin'].includes(user.role)) {
      socket.join('moderators');
      this.addToRoom('moderators', user.id);
    }

    // Salle pour les admins et plus
    if (['admin', 'superadmin'].includes(user.role)) {
      socket.join('administrators');
      this.addToRoom('administrators', user.id);
    }

    // Salle personnelle pour l'utilisateur
    socket.join(`user_${user.id}`);
    this.addToRoom(`user_${user.id}`, user.id);

    console.log(`🏠 Utilisateur ${user.id} assigné aux salles appropriées`);
  }

  addToRoom(roomName, userId) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(userId);
  }

  removeFromRoom(roomName, userId) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(userId);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  getUserRooms(user) {
    const rooms = ['authenticated_users', `role_${user.role}`, `user_${user.id}`];

    if (['moderateur', 'admin', 'superadmin'].includes(user.role)) {
      rooms.push('moderators');
    }

    if (['admin', 'superadmin'].includes(user.role)) {
      rooms.push('administrators');
    }

    return rooms;
  }

  // ====================================================================
  // 📍 GESTION DES ÉVÉNEMENTS POI
  // ====================================================================

  handlePOISubscription(socket, poiId) {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentification requise' });
      return;
    }

    const roomName = `poi_${poiId}`;
    socket.join(roomName);
    this.addToRoom(roomName, socket.userId);

    socket.emit('poi:subscribed', { poiId, room: roomName });
    console.log(`📍 User ${socket.userId} abonné au POI ${poiId}`);
  }

  handlePOIUnsubscription(socket, poiId) {
    const roomName = `poi_${poiId}`;
    socket.leave(roomName);
    if (socket.userId) {
      this.removeFromRoom(roomName, socket.userId);
    }

    socket.emit('poi:unsubscribed', { poiId });
    console.log(`📍 User ${socket.userId} désabonné du POI ${poiId}`);
  }

  handlePOIView(socket, poiId) {
    if (!socket.userId) return;

    // Broadcast aux autres utilisateurs regardant ce POI
    socket.to(`poi_${poiId}`).emit('poi:user_viewing', {
      userId: socket.userId,
      userName: socket.userName,
      poiId: poiId,
      timestamp: new Date().toISOString()
    });

    console.log(`👁️ User ${socket.userId} regarde le POI ${poiId}`);
  }

  // ====================================================================
  // 💬 GESTION DES COMMENTAIRES
  // ====================================================================

  handleCommentTyping(socket, data) {
    const { poiId, commentId } = data;

    socket.to(`poi_${poiId}`).emit('comment:user_typing', {
      userId: socket.userId,
      userName: socket.userName,
      poiId,
      commentId,
      timestamp: new Date().toISOString()
    });
  }

  handleCommentStopTyping(socket, data) {
    const { poiId, commentId } = data;

    socket.to(`poi_${poiId}`).emit('comment:user_stop_typing', {
      userId: socket.userId,
      poiId,
      commentId
    });
  }

  // ====================================================================
  // 👥 GESTION DES UTILISATEURS
  // ====================================================================

  handleGetOnlineUsers(socket) {
    const role = socket.userRole;
    const onlineUsers = this.getOnlineUsersForRole(role);

    socket.emit('users:online_list', {
      users: onlineUsers,
      total: onlineUsers.length,
      timestamp: new Date().toISOString()
    });
  }

  getOnlineUsersForRole(userRole) {
    const users = [];

    for (const [userId, userData] of this.connectedUsers.entries()) {
      // Les admins peuvent voir tout le monde
      if (['admin', 'superadmin'].includes(userRole)) {
        users.push({
          id: userData.id,
          name: userData.name,
          role: userData.role,
          joinedAt: userData.joinedAt,
          lastActivity: userData.lastActivity
        });
      }
      // Les modérateurs peuvent voir les collecteurs et membres
      else if (
        userRole === 'moderateur' &&
        ['membre', 'collecteur', 'moderateur'].includes(userData.role)
      ) {
        users.push({
          id: userData.id,
          name: userData.name,
          role: userData.role
        });
      }
      // Les autres ne voient que leur propre rôle et inférieur
      else if (
        ['membre', 'collecteur'].includes(userRole) &&
        ['membre', 'collecteur'].includes(userData.role)
      ) {
        users.push({
          id: userData.id,
          name: userData.name,
          role: userData.role
        });
      }
    }

    return users;
  }

  handleUserUpdatesSubscription(socket, targetUserId) {
    if (!socket.userId) return;

    // Vérifier les permissions
    if (
      socket.userId !== targetUserId &&
      !['moderateur', 'admin', 'superadmin'].includes(socket.userRole)
    ) {
      socket.emit('error', { message: 'Permission refusée' });
      return;
    }

    socket.join(`user_updates_${targetUserId}`);
    socket.emit('user:subscribed_to_updates', { userId: targetUserId });
  }

  // ====================================================================
  // 🏛️ GESTION DE LA MODÉRATION
  // ====================================================================

  handleModerationSubscription(socket) {
    if (!['moderateur', 'admin', 'superadmin'].includes(socket.userRole)) {
      socket.emit('error', { message: 'Permissions insuffisantes' });
      return;
    }

    socket.join('moderation_updates');
    socket.emit('moderation:subscribed');
    console.log(`🏛️ Modérateur ${socket.userId} abonné aux mises à jour de modération`);
  }

  async handleGetPendingCount(socket) {
    if (!['moderateur', 'admin', 'superadmin'].includes(socket.userRole)) {
      return;
    }

    try {
      const { PointInterest } = require('../models');
      const pendingCount = await PointInterest.count({
        where: { status: 'pending' }
      });

      socket.emit('moderation:pending_count', { count: pendingCount });
    } catch (error) {
      console.error('Erreur récupération POI en attente:', error);
    }
  }

  // ====================================================================
  // 📊 GESTION DES ANALYTICS
  // ====================================================================

  handlePageView(socket, data) {
    const { page, referrer, userAgent } = data;

    // Broadcast aux admins pour analytics en temps réel
    this.io.to('administrators').emit('analytics:page_view', {
      userId: socket.userId,
      page,
      referrer,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  handlePOIInteraction(socket, data) {
    const { poiId, action, metadata } = data;

    // Analytics en temps réel pour les modérateurs
    this.io.to('moderators').emit('analytics:poi_interaction', {
      userId: socket.userId,
      poiId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // ====================================================================
  // 🔧 GESTION SYSTÈME
  // ====================================================================

  handleGetServerInfo(socket) {
    const uptime = Date.now() - this.statistics.startTime.getTime();

    socket.emit('server_info', {
      ...this.statistics,
      uptime,
      rooms: Array.from(this.rooms.keys()),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  // ====================================================================
  // 🚪 GESTION DE LA DÉCONNEXION
  // ====================================================================

  handleDisconnection(socket, reason, connectionTime) {
    const userId = this.userSockets.get(socket.id);
    const sessionDuration = Date.now() - connectionTime.getTime();

    if (userId) {
      // Supprimer de toutes les structures de données
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Supprimer de toutes les salles
      for (const [roomName, users] of this.rooms.entries()) {
        if (users.has(userId)) {
          this.removeFromRoom(roomName, userId);
        }
      }

      // Notifier les autres utilisateurs
      this.broadcastUserStatusChange(userId, 'offline');

      console.log(
        `🚪 Déconnexion: User ${userId} (${reason}) - Session: ${Math.round(sessionDuration / 1000)}s`
      );
    } else {
      console.log(`🚪 Déconnexion socket non authentifié: ${socket.id} (${reason})`);
    }

    this.statistics.currentConnected--;
  }

  // ====================================================================
  // 📢 MÉTHODES DE DIFFUSION
  // ====================================================================

  broadcastUserStatusChange(userId, status) {
    this.io.to('authenticated_users').emit('user:status_change', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // ====================================================================
  // 🔔 MÉTHODES DE NOTIFICATION PUBLIQUES
  // ====================================================================

  // Notifier l'approbation d'un POI
  notifyPOIApproval(data) {
    const { poi, moderator_id, comments } = data;

    // Notification au créateur
    this.io.to(`user_${poi.created_by}`).emit('poi:approved', {
      type: 'poi_approved',
      poi_id: poi.id,
      poi_name: poi.name,
      moderator_id,
      comments,
      timestamp: new Date().toISOString()
    });

    // Notification aux autres modérateurs
    this.io.to('moderators').emit('poi:moderated', {
      type: 'poi_approved',
      poi_id: poi.id,
      poi_name: poi.name,
      action: 'approved',
      moderator_id,
      timestamp: new Date().toISOString()
    });

    // Notification aux utilisateurs abonnés au POI
    this.io.to(`poi_${poi.id}`).emit('poi:status_updated', {
      poi_id: poi.id,
      new_status: 'approved',
      moderator_id,
      timestamp: new Date().toISOString()
    });

    console.log(`🔔 Notifications POI ${poi.id} approuvé envoyées`);
  }

  // Notifier le rejet d'un POI
  notifyPOIRejection(data) {
    const { poi, moderator_id, reason } = data;

    this.io.to(`user_${poi.created_by}`).emit('poi:rejected', {
      type: 'poi_rejected',
      poi_id: poi.id,
      poi_name: poi.name,
      moderator_id,
      reason,
      timestamp: new Date().toISOString()
    });

    this.io.to('moderators').emit('poi:moderated', {
      type: 'poi_rejected',
      poi_id: poi.id,
      poi_name: poi.name,
      action: 'rejected',
      moderator_id,
      timestamp: new Date().toISOString()
    });

    console.log(`🔔 Notifications POI ${poi.id} rejeté envoyées`);
  }

  // Notifier la création d'un nouveau POI
  notifyPOICreated(poi) {
    this.io.to('moderators').emit('poi:created', {
      type: 'new_poi_pending',
      poi_id: poi.id,
      poi_name: poi.name,
      creator_id: poi.created_by,
      quartier: poi.Quartier?.name,
      category: poi.Category?.name,
      timestamp: new Date().toISOString()
    });

    // Mettre à jour le compte des POI en attente
    this.updatePendingPOICount();

    console.log(`🔔 Nouveau POI ${poi.id} notifié aux modérateurs`);
  }

  // Notifier l'ajout d'un commentaire
  notifyCommentAdded(comment, poi) {
    // Notification au propriétaire du POI
    this.io.to(`user_${poi.created_by}`).emit('comment:added', {
      type: 'comment_added',
      comment_id: comment.id,
      poi_id: poi.id,
      poi_name: poi.name,
      author_name: comment.author.name,
      content: comment.content.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Notification aux utilisateurs abonnés au POI
    this.io.to(`poi_${poi.id}`).emit('poi:new_comment', {
      comment_id: comment.id,
      poi_id: poi.id,
      author: {
        id: comment.author.id,
        name: comment.author.name
      },
      content: comment.content,
      timestamp: new Date().toISOString()
    });

    console.log(`🔔 Nouveau commentaire ${comment.id} notifié`);
  }

  // ====================================================================
  // ⏰ TÂCHES PÉRIODIQUES
  // ====================================================================

  setupPeriodicTasks() {
    // Mise à jour des statistiques toutes les minutes
    setInterval(() => {
      this.updateStatistics();
    }, 60000);

    // Nettoyage des salles vides toutes les 5 minutes
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 5 * 60000);

    // Ping des utilisateurs connectés toutes les 30 secondes
    setInterval(() => {
      this.pingConnectedUsers();
    }, 30000);
  }

  async updatePendingPOICount() {
    try {
      const { PointInterest } = require('../models');
      const count = await PointInterest.count({ where: { status: 'pending' } });

      this.io.to('moderators').emit('moderation:pending_count_updated', { count });
    } catch (error) {
      console.error('Erreur mise à jour compte POI:', error);
    }
  }

  updateStatistics() {
    // Mettre à jour l'activité des utilisateurs connectés
    const now = new Date();
    for (const [userId, userData] of this.connectedUsers.entries()) {
      const socket = this.io.sockets.sockets.get(userData.socketId);
      if (socket && socket.connected) {
        userData.lastActivity = now;
      }
    }

    // Diffuser les statistiques aux admins
    this.io.to('administrators').emit('system:statistics_update', {
      ...this.statistics,
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.rooms.size
    });
  }

  cleanupEmptyRooms() {
    let cleaned = 0;
    for (const [roomName, users] of this.rooms.entries()) {
      if (users.size === 0) {
        this.rooms.delete(roomName);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} salles vides nettoyées`);
    }
  }

  pingConnectedUsers() {
    this.io.emit('ping', { timestamp: Date.now() });
  }

  // ====================================================================
  // 📊 MÉTHODES UTILITAIRES
  // ====================================================================

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getConnectedUsersByRole(role) {
    const users = [];
    for (const [userId, userData] of this.connectedUsers.entries()) {
      if (userData.role === role) {
        users.push(userData);
      }
    }
    return users;
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  getUserSocket(userId) {
    const userData = this.connectedUsers.get(userId);
    return userData ? this.io.sockets.sockets.get(userData.socketId) : null;
  }

  getStatistics() {
    return {
      ...this.statistics,
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.rooms.size,
      uptime: Date.now() - this.statistics.startTime.getTime()
    };
  }
}

// Instance singleton
const socketService = new SocketService();

module.exports = socketService;
