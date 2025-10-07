<script setup lang="ts">
import { navigateTo, refreshNuxtData, useFetch } from "nuxt/app";
import { ref } from "vue";
type LoginResponse = {
  ok: boolean;
  user: { id: number; name: string; role: string };
};

const name = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const submit = async () => {
  errorMsg.value = "";
  loading.value = true;
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { name: name.value, password: password.value },
      credentials: "include",
    });
    await Promise.all([refreshNuxtData("me"), refreshNuxtData("users")]);
    await navigateTo("/", { replace: true });
  } catch (e: any) {
    errorMsg.value = e?.statusMessage || "Invalid username or password";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="min-h-screen grid place-items-center bg-gray-50 p-6">
    <form
      class="w-full max-w-sm bg-white p-6 rounded-2xl shadow"
      @submit.prevent="submit"
    >
      <h1 class="text-2xl font-semibold mb-4">Sign in</h1>

      <label class="block mb-4">
        <span class="block text-sm mb-1">Username</span>
        <input
          v-model="name"
          required
          class="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/60"
        />
      </label>

      <label class="block mb-4">
        <span class="block text-sm mb-1">Password</span>
        <input
          v-model="password"
          type="password"
          required
          class="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/60"
        />
      </label>

      <p v-if="errorMsg" class="text-sm text-red-600 mb-3">{{ errorMsg }}</p>

      <button
        :disabled="loading"
        class="w-full bg-black text-white py-2.5 rounded-lg disabled:opacity-60"
      >
        {{ loading ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </main>
</template>
