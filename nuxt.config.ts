import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~~/assets/css/tailwind.css"],
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
  },
  devtools: { enabled: true },
});
