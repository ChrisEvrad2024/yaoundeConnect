const { sequelize } = require('../config/database');
const models = require('../models');
const ApprovalService = require('../services/approvalService');
const AuthService = require('../services/authService');

const testApprovalSystem = async () => {
    console.log('🧪 Test du système d\'approbation POI...\n');

    let testEntities = [];
    const timestamp = Date.now();

    try {
        // 1. Créer les données de test
        console.log('1️⃣ Création des données de test...');

        // Créateur POI
        const creator = await models.User.create({
            name: `Creator ${timestamp}`,
            email: `creator${timestamp}@example.com`,
            password: await AuthService.hashPassword('password123'),
            role: 'collecteur',
            is_email_verified: true
        });
        testEntities.push({ model: 'User', id: creator.id });

        // Modérateur
        const moderator = await models.User.create({
            name: `Moderator ${timestamp}`,
            email: `moderator${timestamp}@example.com`,
            password: await AuthService.hashPassword('password123'),
            role: 'moderateur',
            is_email_verified: true
        });
        testEntities.push({ model: 'User', id: moderator.id });

        // Données géographiques
        const country = await models.Country.create({
            code: 237,
            name: 'Cameroun Test',
            continent_name: 'Afrique',
            flag: 'cm.png'
        });
        await country.update({ translate_id: country.id });
        testEntities.push({ model: 'Country', id: country.id });

        const town = await models.Town.create({
            name: `Yaoundé Test ${timestamp}`,
            description: 'Ville de test',
            longitude: 11.5021,
            latitude: 3.8480,
            country_id: country.id
        });
        await town.update({ translate_id: town.id });
        testEntities.push({ model: 'Town', id: town.id });

        const quartier = await models.Quartier.create({
            name: `Quartier Test ${timestamp}`,
            description: 'Quartier de test',
            longitude: 11.5021,
            latitude: 3.8480,
            town_id: town.id
        });
        await quartier.update({ translate_id: quartier.id });
        testEntities.push({ model: 'Quartier', id: quartier.id });

        const category = await models.Category.create({
            name: `Restaurant Test ${timestamp}`,
            slug: `restaurant-test-${timestamp}`
        });
        await category.update({ translate_id: category.id });
        testEntities.push({ model: 'Category', id: category.id });

        // POI en attente
        const poi = await models.PointInterest.create({
            name: 'Restaurant en attente',
            description: 'Un restaurant à approuver',
            adress: '123 Rue Test',
            latitude: 3.8480,
            longitude: 11.5021,
            quartier_id: quartier.id,
            category_id: category.id,
            user_id: creator.id,
            created_by: creator.id,
            status: 'pending'
        });
        testEntities.push({ model: 'PointInterest', id: poi.id });

        console.log('✅ Données de test créées');

        // 2. Test approbation
        console.log('\n2️⃣ Test approbation POI...');
        const approvalResult = await ApprovalService.approvePOI(
            poi.id,
            moderator.id,
            'Excellent restaurant, approuvé !'
        );

        console.log('✅ POI approuvé avec succès');
        console.log(`   Statut: ${approvalResult.poi.status}`);
        console.log(`   Approuvé par: ${approvalResult.moderator_id}`);
        console.log(`   Commentaires: ${approvalResult.comments}`);

        // Vérifier en base
        const approvedPOI = await models.PointInterest.findByPk(poi.id);
        console.log(`   Vérifié en base: ${approvedPOI.status} (is_verify: ${approvedPOI.is_verify})`);

        // 3. Test rejet d'un nouveau POI
        console.log('\n3️⃣ Test rejet POI...');
        const poi2 = await models.PointInterest.create({
            name: 'Restaurant à rejeter',
            description: 'Un restaurant avec des problèmes',
            adress: '456 Rue Problème',
            latitude: 3.8490,
            longitude: 11.5030,
            quartier_id: quartier.id,
            category_id: category.id,
            user_id: creator.id,
            created_by: creator.id,
            status: 'pending'
        });
        testEntities.push({ model: 'PointInterest', id: poi2.id });

        const rejectionResult = await ApprovalService.rejectPOI(
            poi2.id,
            moderator.id,
            'Informations insuffisantes, veuillez compléter la description et ajouter des photos'
        );

        console.log('✅ POI rejeté avec succès');
        console.log(`   Statut: ${rejectionResult.poi.status}`);
        console.log(`   Raison: ${rejectionResult.reason}`);

        // 4. Test réapprobation
        console.log('\n4️⃣ Test réapprobation POI...');
        const reapprovalResult = await ApprovalService.reapprovePOI(
            poi2.id,
            moderator.id,
            'Finalement approuvé après corrections'
        );

        console.log('✅ POI réapprouvé avec succès');
        console.log(`   Nouveau statut: ${reapprovalResult.poi.status}`);

        // 5. Test liste POI en attente
        console.log('\n5️⃣ Test liste POI en attente...');
        
        // Créer quelques POI supplémentaires en attente
        for (let i = 0; i < 3; i++) {
            const testPOI = await models.PointInterest.create({
                name: `POI Test ${i + 1}`,
                description: `Description du POI ${i + 1}`,
                adress: `${100 + i} Rue Test`,
                latitude: 3.8480 + (i * 0.001),
                longitude: 11.5021 + (i * 0.001),
                quartier_id: quartier.id,
                category_id: category.id,
                user_id: creator.id,
                created_by: creator.id,
                status: 'pending'
            });
            testEntities.push({ model: 'PointInterest', id: testPOI.id });
        }

        const pendingResult = await ApprovalService.getPendingPOIs({
            page: 1,
            limit: 10
        });

        console.log('✅ Liste POI en attente récupérée');
        console.log(`   Total en attente: ${pendingResult.pagination.total}`);
        console.log(`   POI sur cette page: ${pendingResult.data.length}`);

        // 6. Test historique de modération
        console.log('\n6️⃣ Test historique de modération...');
        const history = await ApprovalService.getModerationHistory(poi.id);

        console.log('✅ Historique récupéré');
        console.log(`   Nombre d'actions: ${history.length}`);
        history.forEach((entry, index) => {
            console.log(`   ${index + 1}. ${entry.action} par ${entry.moderator?.name || 'Système'}`);
        });

        // 7. Test statistiques
        console.log('\n7️⃣ Test statistiques de modération...');
        const stats = await ApprovalService.getModerationStats(moderator.id, 'week');

        console.log('✅ Statistiques calculées');
        console.log(`   Période: ${stats.period}`);
        console.log(`   Approbations: ${stats.approvals}`);
        console.log(`   Rejets: ${stats.rejections}`);
        console.log(`   Total: ${stats.total}`);
        console.log(`   Taux d'approbation: ${stats.approval_rate}%`);

        // 8. Test gestion d'erreurs
        console.log('\n8️⃣ Test gestion d\'erreurs...');

        // POI inexistant
        try {
            await ApprovalService.approvePOI(99999, moderator.id);
            console.log('❌ Erreur: devrait échouer pour POI inexistant');
        } catch (error) {
            console.log('✅ Erreur POI inexistant gérée:', error.message);
        }

        // Raison de rejet trop courte
        try {
            await ApprovalService.rejectPOI(poi.id, moderator.id, 'Court');
            console.log('❌ Erreur: devrait échouer pour raison trop courte');
        } catch (error) {
            console.log('✅ Erreur raison courte gérée:', error.message);
        }

        // Double approbation
        try {
            await ApprovalService.approvePOI(poi.id, moderator.id);
            console.log('❌ Erreur: devrait échouer pour double approbation');
        } catch (error) {
            console.log('✅ Erreur double approbation gérée:', error.message);
        }

        console.log('\n🎉 Tous les tests d\'approbation passés avec succès !');

    } catch (error) {
        console.error('\n❌ Erreur dans les tests d\'approbation:', error);
        console.error('Stack:', error.stack);
    } finally {
        // Nettoyage
        console.log('\n🧹 Nettoyage des données de test...');

        for (const entity of testEntities.reverse()) {
            try {
                await models[entity.model].destroy({ where: { id: entity.id } });
                console.log(`   ✅ ${entity.model} ${entity.id} supprimé`);
            } catch (cleanupError) {
                console.log(`   ⚠️  Erreur nettoyage ${entity.model} ${entity.id}:`, cleanupError.message);
            }
        }

        console.log('✅ Nettoyage terminé');
    }
};

testApprovalSystem();