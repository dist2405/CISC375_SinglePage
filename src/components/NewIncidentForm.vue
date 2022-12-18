<template>
  <div class="form">
    <h4 style="text-align: center; color: white; font-weight: bold">
      NEW INCIDENT FORM
    </h4>
    <label>case number: </label>
    <input
      type="text"
      required
      v-model="data.case_number"
      placeholder="ex: 12345678"
    />

    <label>date: </label>
    <input type="date" required v-model="data.date" />

    <label>time: </label>
    <input type="time" step="2" v-model="data.time" />

    <label>code: </label>
    <input type="text" required v-model="data.code" placeholder="ex: 700" />

    <label>incident: </label>
    <input
      type="text"
      required
      v-model="data.incident"
      placeholder="ex: Theft"
    />

    <label>police grid: </label>
    <input
      type="text"
      required
      v-model="data.police_grid"
      placeholder="ex: 123"
    />

    <label>neighborhood id number: </label>
    <input
      type="text"
      required
      v-model="data.neighborhood_number"
      placeholder="ex: 12"
    />

    <label>block: </label>
    <input
      type="text"
      required
      v-model="data.block"
      placeholder="ex: 12XX Street"
    />

    <div type="submit" class="send" value="Submit" @click="submitForm">
      <button>SEND</button>
    </div>
  </div>
</template>

<script>
import $ from "jquery";

export default {
  props: {
    uploadMethod: Function,
  },

  data() {
    return {
      data: {
        case_number: "",
        date: "",
        time: "",
        code: "",
        incident: "",
        police_grid: "",
        neighborhood_number: "",
        block: "",
      },
    };
  },

  methods: {
    submitForm() {
      if (
        this.data.case_number == "" ||
        this.data.date == "" ||
        this.data.time == "" ||
        this.data.code == "" ||
        this.data.incident == "" ||
        this.data.police_grid == "" ||
        this.data.neighborhood_number == "" ||
        this.data.block == ""
      ) {
        window.alert("Please fill out all fields in the form");
      } else {
        this.uploadMethod(
          "PUT",
          "http://localhost:8000/new-incident",
          this.data
        )
          .then((res) => {
            window.alert(res);
          })
          .catch((err) => {
            window.alert(
              "Server request failed. Case number already exists, or the parameters are invalid."
            );
          });
      }
    },
  },
};
</script>

<style>
.form {
  max-width: 420px;
  margin: 10px auto;
  background: rgb(90, 116, 185);
  text-align: left;
  padding: 40px;
  border-radius: 8px;
}

label {
  color: rgb(255, 255, 255);
  display: inline-block;
  margin: 25px 0 15px;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
}

input,
select {
  display: block;
  padding: 10px 6px;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid rgb(255, 255, 255);
  color: rgb(0, 0, 0);
}

input[type="checkbox"] {
  display: inline-block;
  width: 16px;
  margin: 0 1px 0 0;
  position: relative;
  top: 1px;
}

.send {
  text-align: center;
}
</style>
