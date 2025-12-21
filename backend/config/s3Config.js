// backend/config/s3Config.js

// v3 Client'ı çağırıyoruz
const { S3Client } = require('@aws-sdk/client-s3');

// S3 İstemcisini oluşturuyoruz
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

module.exports = s3;