<template>
  <div class="not-found">
    <h1 class="error-code">404</h1>
    <p class="error-message">Pagina non trovata</p>
    <div class="actions">
      <router-link to="/" class="btn btn-primary">Home</router-link>
      <button @click="goBack" class="btn btn-secondary">Indietro</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.error-code {
  font-size: 4rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--color-heading);
  line-height: 1;
}

.error-message {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  color: var(--color-text);
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 0.8rem 1.5rem;
  text-decoration: none;
  border-radius: 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, #fe4654, #404149);
  color: #fff;
  box-shadow: 0 4px 16px rgba(254, 70, 84, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(254, 70, 84, 0.4);
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 2px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .error-code {
    font-size: 3rem;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
}
</style>
