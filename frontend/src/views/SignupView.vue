<!-- filepath: /Users/annu/Desktop/InCrowd/frontend/src/views/SignupView.vue -->
<template>
  <div class="signup">
    <h1>Sign Up</h1>
    <form @submit.prevent="handleSignUp" enctype="multipart/form-data">
      <div>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" v-model="form.nome" required />
      </div>
      <div>
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
        formData.append("cognome", this.form.cognome);
        formData.append("codiceFiscale", this.form.codiceFiscale);
        formData.append("biografia", this.form.biografia);
        formData.append("fotoProfilo", this.form.fotoProfilo.data); // Aggiungi il file immagine
        formData.append("email", this.form.credenziali.email);
        formData.append("password", this.form.credenziali.password);

        const response = await fetch("http://localhost:3000/api/users", {
          method: "POST",
          body: formData, // Invia i dati come FormData
        });

        if (!response.ok) throw new Error("Failed to create user");
        alert("User created successfully!");
      } catch (error) {
        console.error("Error creating user:", error);
        alert("Failed to create user.");
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