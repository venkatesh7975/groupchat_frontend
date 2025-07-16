import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Frontend Environment Variables
VITE_API_URL=https://groupchat-with-payment.onrender.com
VITE_SOCKET_URL=https://groupchat-with-payment.onrender.com
VITE_APP_NAME=Group Chat App
VITE_APP_VERSION=1.0.0
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('🔧 You can now customize the environment variables in the .env file');
  console.log('🚀 Run "npm run dev" to start the development server');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please create a .env file manually with the following content:');
  console.log(envContent);
} 