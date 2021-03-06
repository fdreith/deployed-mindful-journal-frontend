const BASE_URL = "https://mindful-journal.herokuapp.com";

document.addEventListener("DOMContentLoaded", getMoods);

const promptDiv = document.getElementById("prompt-div");
const entriesDiv = document.getElementById("entries-div");
const journalEntriesDiv = document.getElementById("journal-entries");
const entriesTitle = document.getElementById("entries-title");
let timer;
let interval;

const MOODS = (function () {
  const totalMoods = [];
  return {
    save: function (mood) {
      if (!!!MOODS.all().find((mood) => mood.id === this.id)) {
        return totalMoods.push(mood);
      }
    },
    all: function () {
      return totalMoods;
    },
  };
})();

const PROMPTS = (function () {
  const totalPrompts = [];
  return {
    save: function (prompt) {
      if (!!!PROMPTS.all().find((prompt) => prompt.id === this.id)) {
        totalPrompts.push(prompt);
      }
    },
    all: function () {
      return totalPrompts;
    },
  };
})();

const ENTRIES = (function () {
  const totalEntries = [];
  return {
    save: function (entry) {
      return totalEntries.push(entry);
    },
    all: function () {
      return totalEntries;
    },
  };
})();

function getMoods() {
  fetch(`${BASE_URL}/moods/`)
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(function (data) {
      let moods = data.map((mood) => new Mood(mood));
      createPrompts(moods);
      appendMoodPromptOptions();
    })
    .catch(alert);
}

function createPrompts(moods) {
  let prompts = MOODS.all()
    .map((mood) => mood.prompts)
    .flat(1);
  prompts.forEach((prompt) => new Prompt(prompt));
  createEntries();
}

function createEntries() {
  let entries = MOODS.all()
    .map((mood) => mood.entries)
    .flat(1);
  entries.forEach((entry) => new Entry(entry));
  pastEntriesButton();
}

///PROMPTS

function appendMoodPromptOptions() {
  promptDiv.innerHTML = `  
  <h6 class="center-align">How are you feeling today? Select an emotion for a writing prompt.</h6>
  <br>
    `;
  addMoodPromptButtons();
}

function addMoodPromptButtons() {
  MOODS.all().forEach((mood) => {
    promptDiv.insertAdjacentHTML(
      "beforeend",
      ` <a class="waves-effect waves-light btn-large" id="${mood.id}">${mood.mood_type}</a>`
    );
  });
  addPromptListeners();
}

function addPromptListeners() {
  const promptButtons = promptDiv.querySelectorAll("a");
  for (let i = 0; i < promptButtons.length; i++) {
    promptButtons[i].addEventListener("click", randomPrompt);
  }
}

function randomPrompt(e) {
  e.preventDefault();
  let targetPrompts = PROMPTS.all().filter(
    (prompt) => prompt.mood.id === parseInt(e.target.id)
  );
  let randomPrompt = targetPrompts.random();
  renderNewEntryForm(randomPrompt);
}

///NEW ENTRY

function renderNewEntryForm(randomPrompt) {
  promptDiv.innerHTML = `
    <h4 id="prompt">${randomPrompt.question}</h4>
    <p>Minutes:</p>
    <p id="timer"> 0 </p> 
    <div id="prompt-form" class="row">
      <form class="prompt-form" id="new-entry-form">
        <div class="row">
          <div class="input-field prompt-form">
            <textarea id="content" class="materialize-textarea" name="content" value=""></textarea>
            <label for="textarea1">Journal Entry</label>
            <input type="hidden" id="prompt-id" name="prompt-id" value=${randomPrompt.id}>
            <input type="submit" name="" value="Finished with Entry">
          </div>
        </div>
      </form>
    </div>
    `;
  addEntryFormListener();
  startTimer();
}

function startTimer() {
  timer = document.getElementById("timer");
  interval = setInterval(function () {
    timer.innerText++;
  }, 60000);
}

function addEntryFormListener() {
  const promptForm = document.getElementById("prompt-form");
  promptForm.addEventListener("submit", createEntry);
}

function createEntry(e) {
  e.preventDefault();
  const content = document.getElementById("content").value;
  const prompt_id = parseInt(document.getElementById("prompt-id").value);
  const minutes = timer.innerText;
  const entryData = {
    entry: {
      content,
      prompt_id,
      minutes,
    },
  };

  fetch(`${BASE_URL}/entries/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(entryData),
  })
    .then((resp) => resp.json())
    .then((responseJSON) => {
      if (responseJSON.errors) {
        throw new Error(responseJSON.errors);
      } else {
        new Entry(responseJSON);
        appendEntriesDivs();
        appendMoodPromptOptions();
        clearInterval(interval);
      }
    })
    .catch(alert);
}

// GET ENTRIES

function pastEntriesButton() {
  journalEntriesDiv.innerHTML = `
    <br>
    <a class="waves-effect waves-light btn-large center-align" id="get-past-entries">Read Past Journal Entries</a>
    `;
  attachPastEntriesListener();
}

function attachPastEntriesListener() {
  const getPastEntries = document.getElementById("get-past-entries");
  getPastEntries.addEventListener("click", appendEntriesDivs);
}

function appendEntriesDivs() {
  journalEntriesDiv.innerHTML = `
    <h5>Journal Entries:</h5>
    <a id="filter-dropdown" class='dropdown-trigger btn' href='#' data-target='dropdown1'>View Entries By Mood</a>
    <ul id='dropdown1' class='dropdown-content'>
    `;
  addDropdownOptions();
}

function addDropdownOptions() {
  const dropdownOptions = document.getElementById("dropdown1");
  dropdownOptions.insertAdjacentHTML(
    "afterbegin",
    `
      <li><a href="#!" id="all">All Entries</a></li>
      `
  );
  MOODS.all().forEach((mood) => {
    dropdownOptions.insertAdjacentHTML(
      "beforeend",
      `
      <li class="divider" tabindex="-1"></li>
      <li><a href="#!" id="${mood.id}">${mood.mood_type}</a></li>
      `
    );
  });
  getEntries();
  attachMoodListener();
  $(".dropdown-trigger").dropdown();
}

function getEntries() {
  entriesTitle.innerHTML = "";
  sortEntries(ENTRIES.all());
  renderEntries(ENTRIES.all());
}

function sortEntries(entries) {
  entries.sort(function (a, b) {
    let keyA = new Date(a.created_at),
      keyB = new Date(b.created_at);
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
}

function renderEntries(entries) {
  entriesDiv.innerHTML = "";
  if (entries.length > 0) {
    entries.forEach((entry) => renderEntryCard(entry));
  } else {
    entriesDiv.innerHTML = "You don't have any entries.";
  }
}

function renderEntryCard(entry) {
  entriesDiv.insertAdjacentHTML("afterbegin", entry.renderEntry());
  addDeleteButtonListeners();
  addContentListeners();
}

function addDeleteButtonListeners() {
  const deleteButtons = document.querySelectorAll(".delete-div button");
  for (let i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener("click", deleteEntry);
  }
}

function addContentListeners() {
  const cardContent = document.querySelectorAll(".card-content");
  for (let i = 0; i < cardContent.length; i++) {
    let showContent = false;
    cardContent[i].addEventListener("click", expandOrCollapse);
  }
}

function expandOrCollapse(e) {
  e.preventDefault;
  const content =
    e.currentTarget.querySelector(".hide") ||
    e.currentTarget.querySelector(".unhidden");
  if (content.className === "hide") {
    content.className = "unhidden";
  } else {
    content.className = "hide";
  }
}

function deleteEntry(e) {
  e.preventDefault;
  if (window.confirm("Are you sure you want to delete this entry?")) {
    fetch(`${BASE_URL}/entries/${e.target.id}`, {
      method: "DELETE",
    })
      .then((resp) => resp.json())
      .then((responseJSON) => {
        if (responseJSON.message) {
          alert(responseJSON.message);
          deleteEntryFromAll(e.target.id);
          appendEntriesDivs();
        } else {
          throw new Error(responseJSON.errors);
        }
      })
      .catch(alert);
  }
}

function deleteEntryFromAll(id) {
  for (let i = 0; i < ENTRIES.all().length; i++) {
    if (ENTRIES.all()[i].id === parseInt(id)) {
      ENTRIES.all().splice(i, 1);
      i--;
    }
  }
}

// GET ENTRIES BY MOOD

function attachMoodListener() {
  const dropdownOptions = document.getElementById("dropdown1");
  dropdownOptions.addEventListener("click", getEntriesByMood);
}

function getEntriesByMood(e) {
  e.preventDefault;
  if (e.target.id === "all") {
    getEntries();
  } else {
    let mood = MOODS.all().find((mood) => mood.id === parseInt(e.target.id));
    let entries = ENTRIES.all().filter(
      (entry) => entry.mood.id === parseInt(e.target.id)
    );
    entriesTitle.innerHTML = `<h5>Entries that you felt ${mood.mood_type}:</h5>`;
    if (entries.length > 0) {
      sortEntries(entries);
      renderEntries(entries);
    } else {
      entriesDiv.innerHTML = `<h6>You don't have any journal entries in the ${mood.mood_type} category.</h6>`;
    }
  }
}

// RANDOM ARRAY FUNCTION

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};
