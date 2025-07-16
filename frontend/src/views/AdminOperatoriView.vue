<template>
  <div class="admin">
    <h1>Gestione Operatori</h1>
    <form @submit.prevent="create">
      <input v-model="form.nome" placeholder="Nome" required />
      <input v-model="form.cognome" placeholder="Cognome" required />
      <input v-model="form.email" placeholder="Email" required />
      <input v-model="form.password" type="password" placeholder="Password" required />
      <button type="submit">Aggiungi</button>
    </form>
    <ul>
      <li v-for="op in operatori" :key="op._id">
        {{ op.nome }} {{ op.cognome }} - {{ op.credenziali.email }}
        <button @click="remove(op._id)">Elimina</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const operatori = ref<any[]>([])
const form = ref({ nome:'', cognome:'', email:'', password:'' })
const store = useUserStore()

const fetchOperatori = async () => {
  const res = await fetch('http://localhost:3000/api/admin/operatori', {
    headers: { Authorization: `Bearer ${store.token}` }
  })
  operatori.value = await res.json()
}

const create = async () => {
  await fetch('http://localhost:3000/api/admin/operatori', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${store.token}` },
    body: JSON.stringify(form.value)
  })
  form.value = { nome:'', cognome:'', email:'', password:'' }
  fetchOperatori()
}

const remove = async (id:string) => {
  await fetch(`http://localhost:3000/api/admin/operatori/${id}`, {
    method:'DELETE',
    headers:{ Authorization:`Bearer ${store.token}` }
  })
  fetchOperatori()
}

onMounted(fetchOperatori)
</script>

<style scoped>
.admin form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.admin input {
  padding: 0.3rem;
}
</style>
