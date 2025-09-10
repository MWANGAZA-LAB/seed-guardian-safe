import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Track readiness state
let ready = false;

// Serve static files from the dist directory
app.use('/seed-guardian-safe', express.static(path.join(__dirname, 'dist')));

// Health check endpoint - returns 200 immediately, 503 if not ready
app.get('/health', (req, res) => {
  const status = ready ? 200 : 503;
  const response = {
    status: ready ? 'ok' : 'starting',
    timestamp: new Date().toISOString(),
    ready: ready
  };
  
  console.log(`Health check: ${status} - ${response.status}`);
  res.status(status).json(response);
});

// Root redirect to the app
app.get('/', (req, res) => {
  res.redirect('/seed-guardian-safe/');
});

// Start server immediately (don't await initialization)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
  console.log(`Health check available at http://0.0.0.0:${port}/health`);
  console.log(`App available at http://0.0.0.0:${port}/seed-guardian-safe/`);
});

// Simulate initialization (in real app, this would be DB connections, etc.)
(async () => {
  try {
    console.log('Initializing application...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${port}`);
    
    // Check if dist directory exists
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Dist directory not found. Build may have failed.');
    }
    
    // Check if index.html exists in dist
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found in dist directory.');
    }
    
    console.log('Static files verified');
    
    // Simulate startup delay (remove in production)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Application initialization complete');
    ready = true;
    console.log('Application is now ready and healthy');
    
  } catch (error) {
    console.error('Initialization failed:', error);
    console.error('Application will remain unhealthy until fixed');
    // Don't set ready = true on error
  }
})();
