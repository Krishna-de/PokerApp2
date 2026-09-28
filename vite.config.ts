import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The dev proxy acts as the key owner, and `--host` makes it reachable on the Wi-Fi,
// so only the two calls the app makes are let through (no deletes, no other endpoints).
const SPLITWISE_ALLOWED = new Set(['GET /splitwise-api/get_groups', 'POST /splitwise-api/create_expense'])

const splitwiseGuard = (): Plugin => ({
  name: 'splitwise-guard',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = (req.url ?? '').split('?')[0]
      if (!path.startsWith('/splitwise-api') || SPLITWISE_ALLOWED.has(`${req.method} ${path}`)) return next()
      res.statusCode = 403
      res.end('Blocked: only get_groups and create_expense are allowed')
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // SPLITWISE_API_KEY has no VITE_ prefix, so it is never bundled into the app.
  // Only the local dev server uses it, to add the Authorization header when it forwards
  // /splitwise-api/* to Splitwise. The live site has no proxy and keeps Copy / Share only.
  const env = loadEnv(mode, process.cwd(), '')
  const splitwiseKey = command === 'serve' ? env.SPLITWISE_API_KEY?.trim() : ''

  return {
    plugins: [react(), splitwiseGuard()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      __SPLITWISE_PROXY__: JSON.stringify(Boolean(splitwiseKey)),
    },
    server: splitwiseKey
      ? {
          proxy: {
            '/splitwise-api': {
              target: 'https://secure.splitwise.com',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/splitwise-api/, '/api/v3.0'),
              headers: { Authorization: `Bearer ${splitwiseKey}` },
            },
          },
        }
      : undefined,
  }
})
