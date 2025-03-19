// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/content", "@vueuse/nuxt", "@nuxt/eslint"],

  runtimeConfig: {
    elevenlabsApiKey: "",
  },

  nitro: {
    devStorage: {
      audio: {
        driver: "fs",
        base: "./audio",
      },
    },
  },
});
