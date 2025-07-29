async function testPOIApprovalProcess(poiId, adminToken) {
  console.log(`🧪 TEST PROCESSUS APPROBATION POI ${poiId}`);
  console.log('='.repeat(50));

  try {
    // 1. Vérifier que le POI existe
    console.log(`\n1. 🔍 Vérification POI...`);
    const { PointInterest, User } = require('../models');
    const poi = await PointInterest.findByPk(poiId, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });

    if (!poi) {
      throw new Error(`POI ${poiId} non trouvé`);
    }

    console.log(`✅ POI trouvé: ${poi.name}`);
    console.log(`   Status: ${poi.status}`);
    console.log(`   Créateur: ${poi.creator ? poi.creator.email : 'N/A'}`);

    // 2. Test approbation via service
    console.log(`\n2. 🔧 Test service d'approbation...`);
    const ApprovalService = require('../services/approvalService');

    if (poi.status === 'approved') {
      console.log(`⚠️  POI déjà approuvé, on passe le test service`);
    } else {
      const result = await ApprovalService.approvePOI(poiId, 1, 'Test approbation');
      console.log(`✅ Service d'approbation OK`);
    }

    // 3. Test notification
    console.log(`\n3. 📧 Test notifications...`);
    const notificationService = require('../services/notificationService');

    try {
      const testData = {
        poi: poi.toJSON(),
        moderator_id: 1,
        comments: 'Test notification'
      };

      await notificationService.notifyPOIApproval(testData);
      console.log(`✅ Notifications OK`);
    } catch (notifError) {
      console.error(`❌ Erreur notifications: ${notifError.message}`);
    }

    // 4. Test email direct
    console.log(`\n4. 📬 Test email direct...`);
    try {
      const emailService = require('../services/emailService');
      await emailService.sendEmail(
        'test@example.com',
        'Test POI Approval',
        '<h1>Test</h1>',
        'Test email'
      );
      console.log(`✅ Service email OK`);
    } catch (emailError) {
      console.error(`❌ Erreur email: ${emailError.message}`);
    }

    console.log(`\n🎉 Test terminé - vérifiez les logs ci-dessus pour identifier l'erreur`);
  } catch (error) {
    console.error(`❌ Erreur test:`, error);
  }
}

module.exports = { testPOIApprovalProcess };
