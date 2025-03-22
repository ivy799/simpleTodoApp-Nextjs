import { Client } from 'minio';

const minioClient = new Client({
  endPoint: '192.168.1.6',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
});

export { minioClient };