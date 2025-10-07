<script setup lang="ts">
import { clearNuxtData, navigateTo, refreshNuxtData, useFetch } from "nuxt/app";
import { ref, reactive, computed } from "vue";

type Role = "admin" | "user";
type MeResponse = {
  ok: boolean;
  user: { id: number; name: string; role: "admin" | "user" };
};
type UserDto = { id: number; name: string; role: "admin" | "user" };

const { data: me, error: meErr } = await useFetch<MeResponse>("/api/auth/me", {
  key: "me",
  credentials: "include",
  retry: false,
  server: false,
});
if (meErr.value) {
  await navigateTo("/login", { replace: true });
}

const { data: users, refresh: refreshUsers } = await useFetch<UserDto[]>(
  "/api/users",
  {
    key: "users",
    credentials: "include",
    retry: false,
    server: false,
  }
);

const isAdmin = computed(() => me.value?.user.role === "admin");
const isSelf = (id: number) => me.value?.user.id === id;

// create (admin)
const creating = ref(false);
const createErr = ref<string | null>(null);
const editRowErr = reactive<Record<number, string>>({});
const savingId = ref<number | null>(null);
const newUser = reactive<{ name: string; password: string; role: Role }>({
  name: "",
  password: "",
  role: "user",
});
const createUser = async () => {
  createErr.value = null;
  try {
    await $fetch("/api/users", {
      method: "POST",
      credentials: "include",
      body: newUser,
    });
    Object.assign(newUser, { name: "", password: "", role: "user" });
    creating.value = false;
    await refreshNuxtData("users");
  } catch (e: any) {
    if (e?.statusCode === 409) createErr.value = "Username is already taken.";
    else createErr.value = e?.statusMessage || "Failed to create user.";
  }
};

// edit
const editingId = ref<number | null>(null);
const editBuf = reactive<{ name: string; password: string; role: Role | "" }>({
  name: "",
  password: "",
  role: "",
});
const startEdit = (u: UserDto) => {
  editingId.value = u.id;
  editBuf.name = u.name;
  editBuf.password = "";
  editBuf.role = u.role;
  editRowErr[u.id] = "";
};
const cancelEdit = () => {
  if (editingId.value) editRowErr[editingId.value] = "";
  editingId.value = null;
  editBuf.name = "";
  editBuf.password = "";
  editBuf.role = "" as any;
};

const saveEdit = async (id: number) => {
  editRowErr[id] = "";
  savingId.value = id;
  try {
    const current = users.value?.find((u) => u.id === id);
    const body: any = {};
    if (editBuf.name && editBuf.name !== current?.name)
      body.name = editBuf.name;
    if (editBuf.password) body.password = editBuf.password;
    if (isAdmin.value && editBuf.role) body.role = editBuf.role;
    await $fetch(`/api/users/${id}`, {
      method: "PUT",
      credentials: "include",
      body,
    });
    editingId.value = null;
    await refreshNuxtData("users");
  } catch (e: any) {
    if (e?.statusCode === 409) editRowErr[id] = "Username already exists.";
    else editRowErr[id] = e?.statusMessage || "Update failed.";
  } finally {
    savingId.value = null;
  }
};

// delete (admin)
const delUser = async (id: number) => {
  await $fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await refreshUsers();
};

// logout
const logout = async () => {
  await $fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  await Promise.all([clearNuxtData("me"), clearNuxtData("users")]);
  await navigateTo("/login", { replace: true });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b">
      <div class="mx-auto max-w-5xl px-4 h-14 flex items-center justify-end">
        <div class="text-sm flex items-center gap-4">
          <span v-if="me"
            >Signed in as <strong>{{ me.user.name }}</strong> ({{
              me.user.role
            }})</span
          >
          <button
            @click="logout"
            class="px-3 py-1.5 rounded bg-gray-900 text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <!-- admin only create user -->
      <section v-if="isAdmin" class="bg-white p-4 rounded-xl shadow">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Create user</h2>
          <button class="text-sm underline" @click="creating = !creating">
            {{ creating ? "Cancel" : "New user" }}
          </button>
        </div>
        <form
          v-if="creating"
          class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3"
          @submit.prevent="createUser"
        >
          <input
            v-model="newUser.name"
            placeholder="Username"
            required
            class="border rounded px-3 py-2"
          />
          <input
            v-model="newUser.password"
            type="password"
            placeholder="Password"
            required
            class="border rounded px-3 py-2"
          />
          <select v-model="newUser.role" class="border rounded px-3 py-2">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button class="bg-black text-white rounded px-4">Create</button>
        </form>
        <p v-if="createErr" class="mt-2 text-sm text-red-600">
          {{ createErr }}
        </p>
      </section>

      <!-- user table -->
      <section class="bg-white p-4 rounded-xl shadow">
        <h2 class="font-semibold mb-3">Users</h2>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="py-2 pr-4">ID</th>
                <th class="py-2 pr-4">Username</th>
                <th class="py-2 pr-4">Role</th>
                <th class="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users || []" :key="u.id" class="border-b">
                <td class="py-2 pr-4">{{ u.id }}</td>

                <!-- name -->
                <td class="py-2 pr-4">
                  <div v-if="editingId === u.id">
                    <input
                      v-model="editBuf.name"
                      class="border rounded px-2 py-1 w-48"
                    />
                  </div>
                  <div v-else>{{ u.name }}</div>
                </td>

                <!-- role -->
                <td class="py-2 pr-4">
                  <div v-if="editingId === u.id && isAdmin">
                    <select
                      v-model="editBuf.role"
                      class="border rounded px-2 py-1"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div v-else>{{ u.role }}</div>
                </td>

                <!-- actions -->
                <td class="py-2 pr-4 space-x-2">
                  <template v-if="editingId === u.id">
                    <input
                      v-model="editBuf.password"
                      type="password"
                      placeholder="(new password)"
                      class="border rounded px-2 py-1 mr-2"
                    />
                    <button
                      @click="saveEdit(u.id)"
                      class="px-3 py-1 rounded bg-black text-white"
                    >
                      Save
                    </button>
                    <button
                      @click="cancelEdit"
                      class="px-3 py-1 rounded border"
                    >
                      Cancel
                    </button>
                    <p
                      v-if="editRowErr[u.id]"
                      class="mt-2 text-sm text-red-600"
                    >
                      {{ editRowErr[u.id] }}
                    </p>
                  </template>
                  <template v-else>
                    <button
                      v-if="isAdmin || isSelf(u.id)"
                      @click="startEdit(u)"
                      class="px-3 py-1 rounded border"
                    >
                      Edit
                    </button>
                    <button
                      v-if="isAdmin && !isSelf(u.id)"
                      @click="delUser(u.id)"
                      class="px-3 py-1 rounded bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>
