const request = require('supertest');
const app = require('../../src/app');

describe('Performance Tests', () => {

    test('devrait répondre rapidement pour le health check', async () => {
        const start = Date.now();

        await request(app)
            .get('/health')
            .expect(200);

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100); // Moins de 100ms
    });

    test('devrait gérer plusieurs requêtes simultanées', async () => {
        const promises = [];
        const numRequests = 10;

        for (let i = 0; i < numRequests; i++) {
            promises.push(
                request(app)
                    .get('/api/poi')
                    .query({ limit: 5 })
            );
        }

        const responses = await Promise.all(promises);

        responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    test('devrait maintenir des temps de réponse acceptables sous charge', async () => {
        const start = Date.now();
        const promises = [];
        const numRequests = 20;

        for (let i = 0; i < numRequests; i++) {
            promises.push(
                request(app)
                    .get('/api/poi/nearby')
                    .query({
                        latitude: 3.8480,
                        longitude: 11.5021,
                        radius: 5
                    })
            );
        }

        await Promise.all(promises);

        const totalDuration = Date.now() - start;
        const avgDuration = totalDuration / numRequests;

        expect(avgDuration).toBeLessThan(500); // Moins de 500ms en moyenne
    });
});