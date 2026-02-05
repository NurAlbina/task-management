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

let adminEmail;     // Admin email'i (Silmek için tutuyoruz)
let adminToken;     // Admin token'ı
let targetUserId;   // Görev atanacak kullanıcı ID'si
let adminTaskId;    // Admin testi için oluşturulan ekstra görev ID'si

// --- TESTLER BAŞLAMADAN ÖNCE ---
beforeAll(async () => {
    // Veritabanı bağlantısı
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Test ortamı: Veritabanına bağlanıldı.');
        } catch (error) {
            console.error('Test ortamı: Bağlantı hatası!', error);
        }
    }
    
    // Temizlik: Başlamadan önce olası kalıntıları sil
    await User.deleteMany({ email: testUser.email });
});

// --- TÜM TESTLER BİTİNCE (TEMİZLİK ZAMANI) ---
afterAll(async () => {
    console.log("🧹 Test sonrası temizlik yapılıyor...");
    
    // 1. Normal Test Kullanıcısını Sil
    await User.deleteMany({ email: testUser.email });
    
    // 2. Admin Kullanıcısını Sil (Eğer oluşturulduysa)
    if (adminEmail) {
        await User.deleteMany({ email: adminEmail });
    }

    // 3. Normal Görevi Sil
    if (taskId) {
        await Task.findByIdAndDelete(taskId);
    }

    // 4. Admin Testi İçin Oluşturulan Görevi Sil
    if (adminTaskId) {
        await Task.findByIdAndDelete(adminTaskId);
    }

    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log("✨ Temizlik tamamlandı.");
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
        
        expect(res.statusCode).toBe(200);

    });   

    // ==========================================
    // 9. ADMIN TESTLERİ 
    // ==========================================
    

    it('SETUP: Admin Kullanıcısı Oluşturma', async () => {
        const adminData = {
            name: "Admin Tester",
            email: `admin_${Date.now()}@test.com`,
            password: "AdminPass123!"
        };
        
        adminEmail = adminData.email;

        // Kayıt
        await request(app).post('/api/auth/register').send(adminData);

        // ID'yi veritabanından bul
        const createdUser = await User.findOne({ email: adminData.email });
        const newAdminId = createdUser._id;

        // Rolü admin yap
        await User.findByIdAndUpdate(newAdminId, { role: 'admin' });

        // Admin girişi
        const res = await request(app).post('/api/auth/login').send({
            email: adminData.email,
            password: adminData.password
        });
        
        expect(res.statusCode).toBe(200);
        adminToken = res.body.token;

        // Normal kullanıcı ID'sini bul
        const u = await User.findOne({ email: testUser.email });
        targetUserId = u._id;
    });


    // 9.1 TÜM KULLANICILARI GETİR
    it('GET /api/admin/users - Admin tüm kullanıcıları görebilmeli', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });


    // 9.2 GÖREV ATAMA (ASSIGN TASK)
    it('PUT /api/admin/assign - Admin bir görevi başka kullanıcıya atayabilmeli', async () => {
        // Yeni bir görev oluştur (Silinmemesi için yeni yapıyoruz)
        const newTaskRes = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`) 
            .send({
                title: "Admin Tarafından Atanacak Görev",
                category: "Work"
            });
        
        adminTaskId = newTaskRes.body._id; 

        // Atama yap
        const res = await request(app)
            .put('/api/admin/assign')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                taskId: adminTaskId, 
                userId: targetUserId 
            });
        
        expect(res.statusCode).toBe(200);
    });


    // 9.3 YETKİSİZ ERİŞİM TESTİ (Negatif Test)
    it('GET /api/admin/users - Normal kullanıcı admin sayfasına girememeli', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`);
        
        expect([401, 403]).toContain(res.statusCode);
    });
}); 

