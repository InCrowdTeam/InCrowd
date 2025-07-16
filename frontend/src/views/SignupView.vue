<!-- filepath: /Users/annu/Desktop/InCrowd/frontend/src/views/SignupView.vue -->
<template>
  <div class="signup">
    <h1>Sign Up</h1>
    <div class="segmented">
      <button :class="{active: type==='user'}" @click="type='user'">Utente</button>
      <button :class="{active: type==='ente'}" @click="type='ente'">Ente</button>
    </div>
    <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
      <div>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" v-model="form.nome" required />
      </div>
      <div v-if="type==='user'">
        <label for="cognome">Cognome:</label>
        <input type="text" id="cognome" v-model="form.cognome" required />
      </div>
      <div>
        <label for="codiceFiscale">Codice Fiscale:</label>
        <input type="text" id="codiceFiscale" v-model="form.codiceFiscale" required />
      </div>
      <div>
        <label for="biografia">Biografia:</label>
        <textarea id="biografia" v-model="form.biografia" required></textarea>
      </div>
      <div>
        <label for="fotoProfilo">Foto Profilo:</label>
        <input type="file" id="fotoProfilo" @change="handleFileUpload"  />
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="form.credenziali.email" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="form.credenziali.password" required />
      </div>
      <button type="submit">Sign Up</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      type: 'user',
      form: {
        nome: "",
        cognome: "",
        codiceFiscale: "",
        biografia: "",
        fotoProfilo: {
          data: null,
          contentType: "",
        }, // File immagine
        credenziali: {
          email: "",
          password: "",
        },
      },
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.form.fotoProfilo.data = file;
      this.form.fotoProfilo.contentType = file ? file.type : "";
    },
    async handleSignUp() {
      try {
        const formData = new FormData();
        formData.append("nome", this.form.nome);
        if (this.type === 'user') {
          formData.append("cognome", this.form.cognome);
        }
        formData.append("codiceFiscale", this.form.codiceFiscale);
        formData.append("biografia", this.form.biografia);
        if (this.form.fotoProfilo.data) {
          formData.append("fotoProfilo", this.form.fotoProfilo.data);
        }
        formData.append("email", this.form.credenziali.email);
        formData.append("password", this.form.credenziali.password);

        const url = this.type === 'ente'
          ? 'http://localhost:3000/api/enti'
          : 'http://localhost:3000/api/users';

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to create user");
        alert("Registrazione completata!");
      } catch (error) {
        console.error("Error creating user:", error);
        alert("Errore durante la registrazione");
      }
    },
  },
};
</script>

<style scoped>
.signup {
  max-width: 430px;
  margin: 2.5rem auto 0 auto;
  padding: 2rem 2rem 1.5rem 2rem;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
}

.signup h1 {
  text-align: center;
  color: #fe4654;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.segmented {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.segmented button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #fe4654;
  background: #f8f7f3;
  cursor: pointer;
}
.segmented button.active {
  background: #fe4654;
  color: #fff;
}

.signup form > div {
  margin-bottom: 1.1rem;
  display: flex;
  flex-direction: column;
}

.signup label {
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #404149;
  font-size: 1.05rem;
}

.signup input[type="text"],
.signup input[type="email"],
.signup input[type="password"],
.signup input[type="file"],
.signup textarea {
  padding: 0.7rem 1rem;
  border: 1.5px solid #fe4654;
  border-radius: 2rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  background: #f8f7f3;
}

.signup input[type="file"] {
  padding: 0.4rem 0.5rem;
  border-radius: 1rem;
  background: #f8f7f3;
}

.signup input:focus,
.signup textarea:focus {
  border-color: #404149;
}

.signup textarea {
  min-height: 70px;
  resize: vertical;
}

.signup button[type="submit"] {
  width: 100%;
  background: #fe4654;
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.7rem;
  transition: background 0.2s;
  box-shadow: 0 1px 6px rgba(254,70,84,0.07);
}

.signup button[type="submit"]:hover {
  background: #404149;
}

@media (max-width: 600px) {
  .signup {
    padding: 1rem 0.5rem;
  }
}
</style>