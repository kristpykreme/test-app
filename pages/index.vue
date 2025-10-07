<script setup lang="ts">
import { navigateTo, useFetch } from "nuxt/app";

type MeResponse = {
  ok: boolean;
  user: { id: number; name: string; role: string };
};
const { data: me, error } = await useFetch<MeResponse>("/api/auth/me", {
  key: "me",
  credentials: "include",
  headers: { "cache-control": "no-cache" },
  retry: false,
});

const logout = async () => {
  await $fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  await navigateTo("/login", { replace: true });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b">
      <div
        class="mx-auto max-w-5xl px-4 h-14 flex items-center justify-end"
      >
        <button
          @click="logout"
          class="text-sm px-3 py-1.5 rounded bg-gray-900 text-white"
        >
          Logout
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <div v-if="!error && me">
        <h1 class="text-2xl font-semibold">Welcome, {{ me.user.name }}</h1>
        <p class="text-gray-600">Role: {{ me.user.role }}</p>
      </div>
      <div v-else>
        <p class="mb-2">You’re not signed in.</p>
        <NuxtLink to="/login" class="underline">Go to login</NuxtLink>
      </div>
    </main>
  </div>
</template>
