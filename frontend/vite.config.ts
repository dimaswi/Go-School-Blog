import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  // Arahkan loadEnv ke root direktori (satu level di atas folder frontend)
  const env = loadEnv(mode, path.resolve(process.cwd(), '../'), '')
  
  return {
    envDir: '../', // Memberitahu vite untuk mencari .env di parent folder
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
