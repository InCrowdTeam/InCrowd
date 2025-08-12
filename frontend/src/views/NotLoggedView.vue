<template>
  <div class="not-logged-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-icon">🎪</div>
        <h1 class="hero-title">Benvenuto in InCrowd!</h1>
        <p class="hero-subtitle">
          Scopri, partecipa e crea eventi straordinari nella tua città
        </p>
        <div class="cta-buttons">
          <RouterLink to="/addUser" class="btn-primary">
            ✨ Registrati Gratis
          </RouterLink>
          <RouterLink to="/login" class="btn-secondary">
            🚪 Accedi
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Benefits Section -->
    <div class="benefits-section">
      <h2 class="benefits-title">Perché unirsi a InCrowd?</h2>
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-icon">🎯</div>
          <h3>Eventi Personalizzati</h3>
          <p>Scopri eventi che rispecchiano i tuoi interessi e passioni</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">👥</div>
          <h3>Community Attiva</h3>
          <p>Connettiti con persone che condividono le tue passioni</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">🚀</div>
          <h3>Organizza Eventi</h3>
          <p>Crea e gestisci i tuoi eventi in modo semplice e veloce</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">🎉</div>
          <h3>Esperienze Uniche</h3>
          <p>Partecipa a eventi esclusivi e indimenticabili</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">📱</div>
          <h3>Facile da Usare</h3>
          <p>Interfaccia intuitiva e user-friendly per tutti</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">🔒</div>
          <h3>Sicuro e Affidabile</h3>
          <p>I tuoi dati sono protetti e la community è moderata</p>
        </div>
      </div>
    </div>

    <!-- Call to Action Final -->
    <div class="final-cta">
      <div class="final-cta-content">
        <h2>Inizia la tua avventura oggi!</h2>
        <p>Unisciti a migliaia di persone che hanno già scoperto InCrowd</p>
        <RouterLink to="/addUser" class="btn-primary large">
          🌟 Registrati Ora - È Gratis!
        </RouterLink>
        <p class="small-text">
          Hai già un account? 
          <RouterLink to="/login" class="login-link">Accedi qui</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.not-logged-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f7f3 0%, #fff 50%, #f8f7f3 100%);
}

/* Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  color: #fff;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
}

.hero-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.25rem;
  margin: 0 0 2.5rem 0;
  opacity: 0.9;
  line-height: 1.6;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 1.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #fff;
  color: #fe4654;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Benefits Section */
.benefits-section {
  padding: 4rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.benefits-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 3rem 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.benefit-card {
  background: #fff;
  padding: 2rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.benefit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(254, 70, 84, 0.2);
}

.benefit-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.benefit-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #404149;
  margin: 0 0 1rem 0;
}

.benefit-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* Final CTA */
.final-cta {
  background: linear-gradient(135deg, #fe4654 0%, #404149 100%);
  padding: 4rem 1.5rem;
  text-align: center;
  color: #fff;
}

.final-cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.final-cta h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.final-cta p {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

.btn-primary.large {
  font-size: 1.2rem;
  padding: 1.25rem 2.5rem;
  margin-bottom: 1.5rem;
}

.small-text {
  font-size: 0.9rem;
  opacity: 0.8;
}

.login-link {
  color: #fff;
  text-decoration: underline;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: none;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .benefits-title {
    font-size: 2rem;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .final-cta h2 {
    font-size: 2rem;
  }
}
</style>
