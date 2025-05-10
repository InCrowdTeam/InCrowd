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
        formData.append("biografia", this.form.biografia);
        formData.append("fotoProfilo", this.form.fotoProfilo.data); // Aggiungi il file immagine
        formData.append("email", this.form.credenziali.email);
        formData.append("password", this.form.credenziali.password);

        const response = await fetch("http://localhost:3000/api/users", {
          method: "POST",
          body: formData, // Invia i dati come FormData
        });

        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }

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
  max-width: 400px;
  margin: 0 auto;
}
.signup div {
  margin-bottom: 1rem;
}
.signup label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.signup input,
.signup textarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
}
.signup button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}
.signup button:hover {
  background-color: #0056b3;
}
</style>