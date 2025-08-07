// src/migrations/[timestamp]_add_created_by_to_users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne created_by à la table users
    await queryInterface.addColumn('users', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: "ID de l'utilisateur qui a créé cet utilisateur (pour la gestion administrative)"
    });

    // Ajouter un index pour optimiser les requêtes
    await queryInterface.addIndex('users', ['created_by'], {
      name: 'idx_users_created_by'
    });

    // Ajouter la contrainte de clé étrangère
    await queryInterface.addConstraint('users', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fk_users_created_by',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer la contrainte de clé étrangère
    await queryInterface.removeConstraint('users', 'fk_users_created_by');

    // Supprimer l'index
    await queryInterface.removeIndex('users', 'idx_users_created_by');

    // Supprimer la colonne created_by
    await queryInterface.removeColumn('users', 'created_by');
  }
};
