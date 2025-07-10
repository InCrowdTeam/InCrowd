<template>
    <div class="signup">
        <h1>Aggiungi Proposta</h1>
        <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
            <div>
                <label for="titolo">Titolo proposta:</label>
                <input type="text" id="titolo" v-model="form.titolo" required />
            </div>
            <div>
                <label for="descrizione">Descrizione:</label>
                <textarea id="descrizione" v-model="form.descrizione" required></textarea>
            </div>
            <div>
                <label for="foto">Foto:</label>
                <input type="file" id="foto" @change="handleFileUpload" />
            </div>
            <div>
                <label for="categoria">Categoria:</label>
                <select name="categorie" id="categoria-select" v-model="form.categoria">
                    <option value="">--Please choose an option--</option>
                    <option value="cultura">Cultura</option>
                    <option value="concerti">Concerti</option>
                    <option value="mostreInstallazioni">Mostre e installazioni</option>
                    <option value="sport">Sport</option>
                    <option value="workshopCorsi">Workshop e corsi</option>
                    <option value="conferenze">Conferenze</option>
                </select>
            </div>
            <div>
                <label for="citta">Città:</label>
                <input type="text" id="citta" v-model="form.indirizzo.citta" required />
            </div>
            <div>
                <label for="cap">CAP:</label>
                <input type="text" id="cap" v-model="form.indirizzo.cap" required />
            </div>
            <div>
                <label for="via">Via:</label>
                <input type="text" id="via" v-model="form.indirizzo.via" required />
            </div>
            <div>
                <label for="civico">Civico:</label>
                <input type="text" id="civico" v-model="form.indirizzo.civico" required />
            </div>
            <div>
                <label for="data">Data:</label>
                <input type="date" id="data" v-model="form.dataIpotetica" required />
            </div>
            <button type="submit">Aggiungi</button>
        </form>
    </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore'

export default {
  data() {
    return {
      form: {
        titolo: "",
        descrizione: "",
        foto: {
          data: null,
          contentType: "",
        },
        categoria: "",
        indirizzo: {
          citta: "",
          cap: "",
          via: "",
          civico: "",
        },
        dataIpotetica: "",
        proponenteID: "",
   
      },
    };
  },
  mounted() {
    // Recupera l'ID utente loggato da Pinia
    const userStore = useUserStore()
    if (userStore.user && userStore.user._id) {
      this.form.proponenteID = userStore.user._id
    }
  },
  watch: {
    // Aggiorna proponenteID quando cambia lo user nello store
    '$pinia.state.userStore.user'(newUser) {
      if (newUser && newUser._id) {
        this.form.proponenteID = newUser._id;
      }
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.form.foto.data = file;
    },
    async handleSubmit() {
      try {
        this.form.stato = { stato: "in_approvazione", commento: "" };
        const statoPuro = {
          stato: this.form.stato.stato,
          commento: this.form.stato.commento
        };

        const formData = new FormData();
        formData.append("titolo", this.form.titolo);
        formData.append("descrizione", this.form.descrizione);
        if (this.form.foto.data) {
          formData.append("foto", this.form.foto.data); // campo file
        }
        formData.append("categoria", this.form.categoria);
        // Invia i dati dell'indirizzo come campi flat
        formData.append("indirizzo_citta", this.form.indirizzo.citta);
        formData.append("indirizzo_cap", this.form.indirizzo.cap);
        formData.append("indirizzo_via", this.form.indirizzo.via);
        formData.append("indirizzo_civico", this.form.indirizzo.civico);
        formData.append("dataIpotetica", this.form.dataIpotetica);
        formData.append("proponenteID", this.form.proponenteID);
        formData.append("stato", JSON.stringify({
          stato: this.form.stato.stato,
          commento: this.form.stato.commento ?? ""
        }));


        const response = await fetch("http://localhost:3000/api/proposte", {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json().catch(() => ({}));
        console.log("Status:", response.status, "Body:", data);
        if (!response.ok) throw new Error("Failed to create proposta");
        alert("Proposta creata con successo!");
      } catch (error) {
        console.error("Error creating proposta:", error);
        alert("Errore nella creazione della proposta.");
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
.signup input[type="date"],
.signup input[type="file"],
.signup textarea,
.signup select {
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
.signup textarea:focus,
.signup select:focus {
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