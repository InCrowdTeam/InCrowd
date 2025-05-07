<script lang="ts">
    import { onMount } from "svelte";
    
    type User = {
      _id: string;
      nome: string;
      biografia: string;
    };
  
    let users: User[] = [];
    let name = "";
    let email = "";
    let loading = true;
    let error = "";
  
    // Carica utenti dal backend
    async function fetchUsers() {
      loading = true;
      try {
        const res = await fetch("http://localhost:3000/api/users");
        users = await res.json();
      } catch (err) {
        error = "Errore nel recupero utenti";
      }
      loading = false;
    }
  
    // Crea nuovo utente
    async function createUser() {
      if (!name || !email) return;
  
      const res = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
  
      if (res.ok) {
        name = "";
        email = "";
        await fetchUsers();
      } else {
        error = "Errore nella creazione dell'utente";
      }
    }
  
    onMount(fetchUsers);
  </script>
  
  <h1 class="text-xl font-bold mb-4">InCrowd - Utenti</h1>
  
  <form on:submit|preventDefault={createUser} class="mb-4 space-y-2">
    <input bind:value={name} placeholder="Nome" class="border p-2 rounded w-full" />
    <input bind:value={email} placeholder="Email" class="border p-2 rounded w-full" />
    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Aggiungi utente</button>
  </form>
  
  {#if loading}
    <p>Caricamento utenti...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if users.length === 0}
    <p>Nessun utente registrato.</p>
  {:else}
    <ul class="space-y-2">
      {#each users as user}
        <li class="border rounded p-2">
          <strong>{user.nome}</strong> — {user.biografia}
        </li>
      {/each}
    </ul>
  {/if}
  