import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // SPLITWISE_API_KEY has no VITE_ prefix, so it is never bundled into the app.
  // Only the local dev server uses it, to add the Authorization header when it forwards
  // /splitwise-api/* to Splitwise. The live site has no proxy and keeps Copy / Share only.
  const env = loadEnv(mode, process.cwd(), '')
  const splitwiseKey = command === 'serve' ? env.SPLITWISE_API_KEY?.trim() : ''

  return {
    plugins: [react()],
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
