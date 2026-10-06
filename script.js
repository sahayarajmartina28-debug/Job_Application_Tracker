var statuses = ["Applied", "Interview", "Offer", "Rejected"];
var applications = [];
var editingId = null;

var form = document.getElementById("appForm");
var formTitle = document.getElementById("formTitle");
var companyInput = document.getElementById("company");
var roleInput = document.getElementById("role");
var dateInput = document.getElementById("date");
var statusSelect = document.getElementById("status");
var notesInput = document.getElementById("notes");
var errorText = document.getElementById("error");
var cancelBtn = document.getElementById("cancelBtn");
var searchInput = document.getElementById("search");
var filterSelect = document.getElementById("filterStatus");
var board = document.getElementById("board");
var summary = document.getElementById("summary");

function saveData() {
  localStorage.setItem("jobApplications", JSON.stringify(applications));
}

function loadData() {
  var saved = localStorage.getItem("jobApplications");
  if (saved) {
    applications = JSON.parse(saved);
  }
}

function fillDropdowns() {
  var options = "";
  for (var i = 0; i < statuses.length; i++) {
    options += '<option value="' + statuses[i] + '">' + statuses[i] + "</option>";
  }
  statusSelect.innerHTML = options;
  filterSelect.innerHTML = '<option value="">All statuses</option>' + options;
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function safeText(text) {
  text = String(text);
  text = text.replace(/&/g, "&amp;");
  text = text.replace(/</g, "&lt;");
  text = text.replace(/>/g, "&gt;");
  return text;
}

function saveApplication(event) {
  event.preventDefault();

  var company = companyInput.value.trim();
  var role = roleInput.value.trim();
  var date = dateInput.value;
  var status = statusSelect.value;
  var notes = notesInput.value.trim();

  if (company === "" || role === "" || date === "") {
    errorText.textContent = "Company, role and date are required.";
    return;
  }

  for (var i = 0; i < applications.length; i++) {
    var app = applications[i];
    var sameCompany = app.company.toLowerCase() === company.toLowerCase();
    var sameRole = app.role.toLowerCase() === role.toLowerCase();
    var isDifferentItem = app.id !== editingId;

    if (sameCompany && sameRole && isDifferentItem) {
      errorText.textContent = "You already added this company and role.";
      return;
    }
  }

  if (editingId === null) {
    var newApp = {
      id: Date.now(),
      company: company,
      role: role,
      date: date,
      status: status,
      notes: notes
    };
    applications.push(newApp);
  } else {
    for (var j = 0; j < applications.length; j++) {
      if (applications[j].id === editingId) {
        applications[j].company = company;
        applications[j].role = role;
        applications[j].date = date;
        applications[j].status = status;
        applications[j].notes = notes;
      }
    }
  }

  saveData();
  resetForm();
  showAll();
}

function editApplication(id) {
  for (var i = 0; i < applications.length; i++) {
    if (applications[i].id === id) {
      companyInput.value = applications[i].company;
      roleInput.value = applications[i].role;
      dateInput.value = applications[i].date;
      statusSelect.value = applications[i].status;
      notesInput.value = applications[i].notes;
      editingId = id;
      formTitle.textContent = "Edit Application";
      cancelBtn.hidden = false;
      window.scrollTo(0, 0);
    }
  }
}

function resetForm() {
  form.reset();
  dateInput.value = todayDate();
  editingId = null;
  formTitle.textContent = "Add Application";
  cancelBtn.hidden = true;
  errorText.textContent = "";
}

function deleteApplication(id) {
  var sure = confirm("Delete this application?");
  if (sure === false) {
    return;
  }

  var remaining = [];
  for (var i = 0; i < applications.length; i++) {
    if (applications[i].id !== id) {
      remaining.push(applications[i]);
    }
  }
  applications = remaining;

  saveData();
  showAll();
}

function changeStatus(id, newStatus) {
  for (var i = 0; i < applications.length; i++) {
    if (applications[i].id === id) {
      applications[i].status = newStatus;
    }
  }
  saveData();
  showAll();
}

function showSummary() {
  var html = "<span>Total: " + applications.length + "</span>";

  for (var i = 0; i < statuses.length; i++) {
    var count = 0;
    for (var j = 0; j < applications.length; j++) {
      if (applications[j].status === statuses[i]) {
        count++;
      }
    }
    html += "<span>" + statuses[i] + ": " + count + "</span>";
  }

  summary.innerHTML = html;
}

function showBoard() {
  var searchText = searchInput.value.trim().toLowerCase();
  var chosenStatus = filterSelect.value;
  var boardHTML = "";

  for (var i = 0; i < statuses.length; i++) {
    var currentStatus = statuses[i];
    var cardsHTML = "";
    var cardCount = 0;

    for (var j = 0; j < applications.length; j++) {
      var app = applications[j];

      if (app.status !== currentStatus) {
        continue;
      }

      var inCompany = app.company.toLowerCase().indexOf(searchText) !== -1;
      var inRole = app.role.toLowerCase().indexOf(searchText) !== -1;
      if (inCompany === false && inRole === false) {
        continue;
      }

      if (chosenStatus !== "" && app.status !== chosenStatus) {
        continue;
      }

      var statusOptions = "";
      for (var k = 0; k < statuses.length; k++) {
        var selected = "";
        if (statuses[k] === app.status) {
          selected = " selected";
        }
        statusOptions += '<option value="' + statuses[k] + '"' + selected + ">" + statuses[k] + "</option>";
      }

      cardsHTML += '<div class="app-card">';
      cardsHTML += "<h4>" + safeText(app.company) + "</h4>";
      cardsHTML += '<div class="role">' + safeText(app.role) + "</div>";
      cardsHTML += '<div class="date">Applied: ' + safeText(app.date) + "</div>";
      if (app.notes !== "") {
        cardsHTML += '<div class="notes">' + safeText(app.notes) + "</div>";
      }
      cardsHTML += '<div class="card-actions">';
      cardsHTML += '<select onchange="changeStatus(' + app.id + ', this.value)">' + statusOptions + "</select>";
      cardsHTML += '<button class="small secondary" onclick="editApplication(' + app.id + ')">Edit</button>';
      cardsHTML += '<button class="small danger" onclick="deleteApplication(' + app.id + ')">Delete</button>';
      cardsHTML += "</div></div>";

      cardCount++;
    }

    if (cardCount === 0) {
      cardsHTML = '<p class="empty">Nothing here</p>';
    }

    boardHTML += '<div class="column">';
    boardHTML += "<h3>" + currentStatus + " <span>" + cardCount + "</span></h3>";
    boardHTML += cardsHTML;
    boardHTML += "</div>";
  }

  board.innerHTML = boardHTML;
}

function showAll() {
  showSummary();
  showBoard();
}

form.addEventListener("submit", saveApplication);
cancelBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", showAll);
filterSelect.addEventListener("change", showAll);

loadData();
fillDropdowns();
dateInput.value = todayDate();
showAll();