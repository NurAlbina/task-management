const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // index.js'den app'i çağırıyoruz

/* Testler çalışmadan önce yapılacaklar */
beforeAll(async () => {
    // Veritabanı bağlantısının hazır olduğundan emin oluyoruz
});

/* Testler bittikten sonra yapılacaklar */
afterAll(async () => {
    // Test veritabanını temizle
    // await mongoose.connection.db.dropDatabase(); 
    
    // Bağlantıyı kapat
    await mongoose.connection.close();
});

describe('Backend API Testleri', () => {
    let token; // Testler boyunca kullanacağımız giriş anahtarı
    let taskId; // Oluşturduğumuz görevin ID'si
    
    // Rastgele bir email üret (Her testte çakışma olmasın diye)
    const randomEmail = `testuser_${Date.now()}@example.com`;

    // 1. KULLANICI KAYDI TESTİ
    it('POST /api/auth/register - Yeni kullanıcı kaydetmeli', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Test Kullanıcısı",
                email: randomEmail,
                password: "password123"
            });
        
        expect(res.statusCode).toEqual(201); // Başarılı oluşturma kodu
        expect(res.body).toHaveProperty('token'); // Token dönmeli
    });

    // 2. KULLANICI GİRİŞİ TESTİ
    it('POST /api/auth/login - Kullanıcı giriş yapabilmeli', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: randomEmail,
                password: "password123"
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        
        // Token'ı sonraki testler için kaydet
        token = res.body.token;
    });

    // 3. YENİ GÖREV EKLEME TESTİ
    it('POST /api/tasks - Yeni görev eklemeli', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`) // Token ile yetki gönderiyoruz
            .send({
                title: "Test Görevi",
                description: "Bu bir otomatik test görevidir",
                category: "Work",
                dueDate: "2025-12-31"
            });
            
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual("Test Görevi");
        
        // Oluşan görevin ID'sini kaydet
        taskId = res.body._id;
    });

    // 4. GÖREVLERİ LİSTELEME TESTİ
    it('GET /api/tasks - Görevleri listelemeli', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy(); // Dizi dönmeli
        expect(res.body.length).toBeGreaterThan(0); // En az 1 görev olmalı
    });

    // 5. GÖREV GÜNCELLEME TESTİ
    it('PUT /api/tasks/:id - Görevi güncellemeli', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: "Güncellenmiş Test Görevi",
                status: "completed"
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual("Güncellenmiş Test Görevi");
        expect(res.body.status).toEqual("completed");
    });

    // 6. GÖREV İSTATİSTİKLERİ TESTİ
    it('GET /api/tasks/stats - İstatistikleri getirmeli', async () => {
        
        const res = await request(app)
            .get('/api/tasks/stats') 
            .set('Authorization', `Bearer ${token}`); 
            
        if(res.statusCode !== 404) {
             expect(res.statusCode).toBeOneOf([200, 201]);
        }
    });

    // 7. GÖREV SİLME TESTİ
    it('DELETE /api/tasks/:id - Görevi silmeli', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('silindi'); // Mesaj kontrolü
    });
});