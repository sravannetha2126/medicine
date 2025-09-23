let reminders = [];
let capturedPhoto = "";

// Load saved reminders on page load
window.onload = function() {
  const saved = localStorage.getItem("reminders");
  if (saved) {
    reminders = JSON.parse(saved);
    updateReminderList();
  }
}

// Camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { 
    const video = document.getElementById("camera");
    video.srcObject = stream;
    video.play();
  })
  .catch(err => { alert("Camera access denied or not supported: "+err); });

// Capture photo from camera
function capturePhoto() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
  capturedPhoto = canvas.toDataURL("image/png");
  document.getElementById("preview").src = capturedPhoto;
}

// Add reminder
function addReminder() {
  const lang = document.getElementById("language").value;
  const name = document.getElementById("medicineName").value;
  const photo = capturedPhoto;
  const time = document.getElementById("time").value;
  const days = Array.from(document.getElementById("days").selectedOptions).map(o => o.value);

  if (!time || !photo) { 
    alert("Please select time & capture photo"); 
    return; 
  }

  reminders.push({ lang, name, photo, time, days, doneToday: false });

  // Save to localStorage
  localStorage.setItem("reminders", JSON.stringify(reminders));

  updateReminderList();
}

// Update reminder list in UI
function updateReminderList() {
  const list = document.getElementById("reminderList");
  list.innerHTML = "<h3>Reminders</h3>"; // clear previous content

  if(reminders.length === 0){
    list.innerHTML += "<p>No reminders added yet.</p>";
    return;
  }

  reminders.forEach(r => {
    const daysText = r.days.join(", ");
    list.innerHTML += `
      <div class="reminder-item">
        <b>${r.name || "Medicine"}</b> at ${r.time} [${daysText}]
      </div>
    `;
  });
}

// Get current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2,'0');
  const minutes = now.getMinutes().toString().padStart(2,'0');
  return `${hours}:${minutes}`; // format "08:05"
}

// Check reminders every second
function checkReminders() {
  const currentTime = getCurrentTime();
  const now = new Date();
  const currentDay = ["sun","mon","tue","wed","thu","fri","sat"][now.getDay()];

  reminders.forEach(rem => {
    if (!rem.doneToday &&
        rem.time === currentTime &&
        (rem.days.includes("daily") || rem.days.includes(currentDay))) {
      showPopup(rem);
    }
  });
}

// Show popup for reminder
function showPopup(rem){
  const texts = {
    en: `💊 Time to take ${rem.name || "medicine"}!`,
    te: `${rem.name || ""} మాత్రలు తీసుకునే సమయం!`,
    hi: `${rem.name || ""} दवा लेने का समय!`
  };

  const popup = document.getElementById("popup");
  document.getElementById("popupText").innerText = texts[rem.lang];
  document.getElementById("popupImg").src = rem.photo;

  popup.classList.add("show");
  popup.style.display = "block";
  document.getElementById("overlay").style.display = "block";

  const beep = document.getElementById("beep");
  beep.currentTime = 0;
  beep.play();

  // Clear previous interval if exists
  if (window.alarmInterval) clearInterval(window.alarmInterval);

  // Repeat beep every second
  window.alarmInterval = setInterval(() => {
    beep.currentTime = 0;
    beep.play();
  }, 1000);

  // Floating medicine icons animation
  for(let i=0;i<5;i++){
    const med = document.createElement("img");
    med.src = "https://cdn-icons-png.flaticon.com/512/2907/2907219.png";
    med.className = "medicine-anim";
    med.style.left = Math.random()*80 + "%";
    med.style.animationDuration = (2+Math.random()*2)+"s";
    document.body.appendChild(med);
    setTimeout(()=>med.remove(),4000);
  }
}

// Close popup
function closePopup(){
  const popup = document.getElementById("popup");
  popup.classList.remove("show");
  popup.style.display = "none";
  document.getElementById("overlay").style.display = "none";

  // Stop alarm
  const beep = document.getElementById("beep");
  beep.pause();
  beep.currentTime = 0;
  if (window.alarmInterval) clearInterval(window.alarmInterval);

  // Mark reminder as done today
  const popupImg = document.getElementById("popupImg").src;
  reminders.forEach(rem => {
    if (rem.photo === popupImg) rem.doneToday = true;
  });

  // Update localStorage
  localStorage.setItem("reminders", JSON.stringify(reminders));

  updateReminderList();
}

// Reset reminders at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    reminders.forEach(rem => rem.doneToday = false);
    localStorage.setItem("reminders", JSON.stringify(reminders));
  }
}, 60000); // check every minute

// Check reminders every second
setInterval(checkReminders,1000);

// Optional: Clear all reminders
function clearAllReminders() {
  reminders = [];
  localStorage.removeItem("reminders");
  updateReminderList();
}
