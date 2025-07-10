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
import { useUserStore } from '@/stores/userStore' // <--- AGGIUNGI QUESTA RIGA

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
        proponenteID: "", // <--- aggiungi qui
   
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
    // AGGIUNGI QUESTO
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