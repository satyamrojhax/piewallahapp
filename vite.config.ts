import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/todays-schedule": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/todays-schedule/, '/v1/batches'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extract batchId from query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const isNewStudyMaterialFlow = url.searchParams.get('isNewStudyMaterialFlow');
            
            // Rewrite the path to include batchId
            if (batchId) {
              const newPath = `/v1/batches/${batchId}/todays-schedule?batchId=${batchId}&isNewStudyMaterialFlow=${isNewStudyMaterialFlow || 'true'}`;
              proxyReq.path = newPath;
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/weekly-schedules": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/weekly-schedules/, '/v1/batches'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extract query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const batchSubjectId = url.searchParams.get('batchSubjectId') || '';
            const startDate = url.searchParams.get('startDate');
            const endDate = url.searchParams.get('endDate');
            const page = url.searchParams.get('page') || '1';
            
            // Rewrite the path to include all params
            if (batchId && startDate && endDate) {
              const newPath = `/v1/batches/${batchId}/weekly-schedules?batchId=${batchId}&batchSubjectId=${batchSubjectId}&startDate=${startDate}&endDate=${endDate}&page=${page}`;
              proxyReq.path = newPath;
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/weekly-planner": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/weekly-planner/, '/v3/test-service/tests'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extract query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const startDate = url.searchParams.get('startDate');
            
            // Rewrite the path to include all params
            if (batchId && startDate) {
              const newPath = `/v3/test-service/tests/${batchId}/weekly-planner?batchId=${batchId}&startDate=${startDate}`;
              proxyReq.path = newPath;
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/topics": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/topics/, '/v2/batches'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extract query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const subjectId = url.searchParams.get('subjectId');
            const page = url.searchParams.get('page') || '1';
            
            // Rewrite the path to include all params
            if (batchId && subjectId) {
              const newPath = `/v2/batches/${batchId}/subject/${subjectId}/topics?page=${page}`;
              proxyReq.path = newPath;
              
              // Add required headers for PenPencil API
              proxyReq.setHeader('client-id', '5eb393ee95fab7468a79d189');
              proxyReq.setHeader('client-type', 'WEB');
              proxyReq.setHeader('client-version', '4.4.15');
              proxyReq.setHeader('accept-language', 'en-GB,en-US;q=0.9,en;q=0.8');
              proxyReq.setHeader('priority', 'u=1, i');
              proxyReq.setHeader('sec-fetch-dest', 'empty');
              proxyReq.setHeader('sec-fetch-mode', 'cors');
              proxyReq.setHeader('sec-fetch-site', 'cross-site');
              proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36');
              proxyReq.setHeader('version', '0.0.1');
              
              // Generate a random ID for this request
              const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              proxyReq.setHeader('randomid', randomId);
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/contents": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/contents/, '/v2/batches'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extract query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const subjectId = url.searchParams.get('subjectId');
            const tag = url.searchParams.get('tag');
            const contentType = url.searchParams.get('contentType') || 'videos';
            const page = url.searchParams.get('page') || '1';
            
            // Rewrite the path to include all params
            if (batchId && subjectId && tag) {
              const newPath = `/v2/batches/${batchId}/subject/${subjectId}/contents?page=${page}&contentType=${contentType}&tag=${tag}`;
              proxyReq.path = newPath;
              
              // Add required headers for PenPencil API
              proxyReq.setHeader('client-id', '5eb393ee95fab7468a79d189');
              proxyReq.setHeader('client-type', 'WEB');
              proxyReq.setHeader('client-version', '4.4.15');
              proxyReq.setHeader('accept-language', 'en-GB,en-US;q=0.9,en;q=0.8');
              proxyReq.setHeader('priority', 'u=1, i');
              proxyReq.setHeader('sec-fetch-dest', 'empty');
              proxyReq.setHeader('sec-fetch-mode', 'cors');
              proxyReq.setHeader('sec-fetch-site', 'cross-site');
              proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36');
              proxyReq.setHeader('version', '0.0.1');
              
              // Generate a random ID for this request
              const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              proxyReq.setHeader('randomid', randomId);
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/schedule-details": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/schedule-details/, '/v1'),
        configure: (proxy: any, _options: any) => {
          proxy.on("proxyReq", (proxyReq: any, req: any, _res: any) => {
            // Extract query params
            const requestUrl = req.url || '';
            const host = req.headers.host || 'localhost:8080';
            const url = new URL(requestUrl, `http://${host}`);
            const batchId = url.searchParams.get('batchId');
            const subjectId = url.searchParams.get('subjectId');
            const scheduleId = url.searchParams.get('scheduleId');
            
            // Rewrite path to include all params - using the exact pattern from user's example
            if (batchId && subjectId && scheduleId) {
              const newPath = `/v1/batches/${batchId}/subject/${subjectId}/schedule/${scheduleId}/schedule-details`;
              proxyReq.path = newPath;
              
              // Add required headers for PenPencil API - matching the user's example exactly
              proxyReq.setHeader('client-id', '5eb393ee95fab7468a79d189');
              proxyReq.setHeader('client-type', 'WEB');
              proxyReq.setHeader('client-version', '200');
              proxyReq.setHeader('accept-language', 'en-GB,en-US;q=0.9,en;q=0.8');
              proxyReq.setHeader('priority', 'u=1, i');
              proxyReq.setHeader('sec-fetch-dest', 'empty');
              proxyReq.setHeader('sec-fetch-mode', 'cors');
              proxyReq.setHeader('sec-fetch-site', 'cross-site');
              proxyReq.setHeader('secure-video-required', 'true');
              proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36');
              proxyReq.setHeader('version', '0.0.1');
              
              // Generate a random ID for this request
              const randomId = 'dc1b9e63-87a1-40e6-8e9f-9cc760545553'; // Using the same random ID from user's example
              proxyReq.setHeader('randomid', randomId);
            }
            
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api/attachments": {
        target: "https://piewallahapi.vercel.app",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/attachments/, '/api/attachments'),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/api": {
        target: "https://pw-api-0585c7015531.herokuapp.com",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "^/announcement-api/v1/batches/.*/announcement": {
        target: "https://api.penpencil.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/announcement-api/, ''),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/video-proxy": {
        target: "https://sec-prod-mediacdn.pw.live",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/video-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/video-api-proxy": {
        target: "https://piewallahapi.vercel.app/api",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/video-api-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
          });
        },
      },
      "/ipify": {
        target: "https://api.ipify.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ipify/, ''),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("Origin");
            proxyReq.removeHeader("Referer");
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        },
      },
    },
  },
  define: {
    // Make environment variables available at build time
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      mode === 'development' ? 'http://localhost:8080' : 'https://satyamrojhax.vercel.app'
    ),
    'import.meta.env.VITE_ANNOUNCEMENT_API_BASE_URL': JSON.stringify(
      mode === 'development' ? 'http://localhost:8080/announcement-api' : 'https://satyamrojhax.vercel.app/announcement-api'
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-select'],
          video: ['video.js', 'hls.js', 'shaka-player', 'dashjs'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ]
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pie Wallah : Learning Platform',
        short_name: 'Pie Wallah',
        description: 'Your gateway to academic excellence. Quality education for Class 9th & 10th CBSE students.',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/pw-api-0585c7015531\.herokuapp\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.penpencil\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'announcement-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30 // 30 minutes
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          }
        ]
      },
      devOptions: {
        enabled: mode === "development",
        type: 'module'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
