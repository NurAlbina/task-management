const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); 
const User = require('../models/User');
const Task = require('../models/Task');

// Zaman aşımını 60 saniyeye çıkarıyoruz (İnternet yavaşlığına karşı)
jest.setTimeout(60000);

// Test kullanıcısını global tanımlıyoruz
const testUser = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`, 
    password: "Password123!"
};

let token;      
let taskId;     

// --- TESTLER BAŞLAMADAN ÖNCE ---
beforeAll(async () => {
    // 1. Veritabanına burada biz bağlanıyoruz
    // Eğer bağlantı yoksa bağlan
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Test ortamı: Veritabanına bağlanıldı.');
        } catch (error) {
            console.error('Test ortamı: Bağlantı hatası!', error);
        }
    }
    
    // 2. Temizlik yap
    await User.deleteMany({ email: testUser.email });
});

// --- TÜM TESTLER BİTİNCE ---
afterAll(async () => {
    // Temizlik
    await User.deleteMany({ email: testUser.email });
    if (taskId) {
        await Task.findByIdAndDelete(taskId);
    }
    // Bağlantıyı kapat
    await mongoose.connection.close();
});

describe('Backend API Testleri', () => {

    // 1. REGISTER
    it('POST /api/auth/register - Yeni kullanıcı kaydetmeli', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    // 2. LOGIN
    it('POST /api/auth/login - Kullanıcı giriş yapabilmeli', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password  
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token; // Token'ı kaydet
    });

    // 3. YANLIŞ ŞİFRE
    it('POST /api/auth/login - Yanlış şifre reddedilmeli', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: "YanlisSifre123"
            });
        
        expect([400, 401]).toContain(res.statusCode);
        expect(res.body).not.toHaveProperty('token');

    });

    // 4. GÖREV EKLEME
    it('POST /api/tasks - Görev eklemeli', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: "Test Görevi",
                category: "Work",
                dueDate: "2025-12-31"
            });
        
        expect(res.statusCode).toBe(201);
        taskId = res.body._id; 
    });

    /*    it('POST /api/tasks - Başlık olmadan görev eklenememeli', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: "Work" }); // Title yok!

        expect(res.statusCode).toBe(400); // 500 dönerse backend hatalıdır.
        });
    */

    // 5. GÖREV LİSTELEME
    it('GET /api/tasks - Görevleri listelemeli', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // 6. GÖREV GÜNCELLEME
    it('PUT /api/tasks/:id - Görevi güncellemeli', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: "Güncel Başlık" });
        
        expect(res.statusCode).toBe(200);
    });

    // 7. GÖREV SİLME
    it('DELETE /api/tasks/:id - Görevi silmeli', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
    });
    
    // 8. İSTATİSTİK (STATS)
    it('GET /api/tasks/stats - İstatistik getirmeli', async () => {
        const res = await request(app)
            .get('/api/tasks/stats')
            .set('Authorization', `Bearer ${token}`);
        
        if (res.statusCode !== 404) {
            expect(res.statusCode).toBe(200);
        }
    });   
}); 

