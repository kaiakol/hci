let countdown;
let paused = false;
let remainingSeconds = 0;
let endTime = 0;
let currentPasta = "";
let currentMinutes = 0;
let totalSeconds = 0;

function setCircleProgress(percent) {
  const circle = document.getElementById("progressBar");
  const circumference = 2 * Math.PI * 60;
  percent = Math.max(0, percent);
  const offset = circumference * (1 - percent);
  circle.style.strokeDashoffset = offset;
}

function startTimer(pasta, minutes, resume = false) {
  clearInterval(countdown);
  const title = document.getElementById("title");
  const timerDisplay = document.getElementById("timer");
  const pausePlayBtn = document.getElementById("pausePlayBtn");
  const restartBtn = document.getElementById("restartBtn");
  const doneSound = document.getElementById("doneSound");
  title.textContent = `${
    pasta.charAt(0).toUpperCase() + pasta.slice(1)
  } cooking...`;
  pausePlayBtn.style.display = "inline-block";
  restartBtn.style.display = "inline-block";
  pausePlayBtn.textContent = "||";
  paused = false;

  currentPasta = pasta;
  currentMinutes = minutes;
  totalSeconds = minutes * 60;

  if (!resume) {
    remainingSeconds = totalSeconds;
  }
  endTime = Date.now() + remainingSeconds * 1000;

  function updateTimer() {
    if (!paused) {
      remainingSeconds = Math.round((endTime - Date.now()) / 1000);
    }
    if (remainingSeconds <= 0) {
      clearInterval(countdown);
      timerDisplay.textContent = "🍝";
      title.textContent = `${
        pasta.charAt(0).toUpperCase() + pasta.slice(1)
      } is ready!`;
      doneSound.play();
      pausePlayBtn.style.display = "none";
      restartBtn.style.display = "inline-block";
      setCircleProgress(1);
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
      return;
    }
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    setCircleProgress((totalSeconds - remainingSeconds) / totalSeconds);
  }

  updateTimer();
  countdown = setInterval(updateTimer, 1000);
}

document.getElementById("pausePlayBtn").onclick = function () {
  const pausePlayBtn = document.getElementById("pausePlayBtn");
  if (!paused) {
    paused = true;
    clearInterval(countdown);
    pausePlayBtn.textContent = "▷";
  } else {
    paused = false;
    endTime = Date.now() + remainingSeconds * 1000;
    pausePlayBtn.textContent = " ||";
    startTimer(currentPasta, currentMinutes, true);
  }
};

document.getElementById("restartBtn").onclick = function () {
  paused = false;
  document.getElementById("pausePlayBtn").textContent = "||";
  startTimer(currentPasta, currentMinutes);
};

async function fetchPastaMap(userId) {
  let url;

  if (userId) {
    url = `https://firestore.googleapis.com/v1/projects/pastatimer-25/databases/(default)/documents/user_timers/${userId}`;
  } else {
    url =
      "https://firestore.googleapis.com/v1/projects/pastatimer-25/databases/(default)/documents/timers/pasta";
  }
  const docRef = await fetch(url);
  const json = await docRef.json();
  const fields = json.fields || {};
  const result = {};
  for (let [key, val] of Object.entries(fields)) {
    result[key.toLowerCase()] = parseFloat(
      val.doubleValue || val.integerValue || "0"
    );
  }
  return result;
}

window.onload = async function () {
  if (localStorage.getItem("pastaTimersUpdated") === "1") {
    localStorage.removeItem("pastaTimersUpdated");
    window.location.reload();
    return;
  }
  let userId = null;
  if (window.firebaseAuth) {
    userId = window.firebaseAuth.currentUser
      ? window.firebaseAuth.currentUser.uid
      : null;
  }
  const params = new URLSearchParams(window.location.search);
  const timer = params.get("timer");

  const pastaMap = await fetchPastaMap(userId);

  if (timer && pastaMap[timer.toLowerCase()]) {
    startTimer(timer, pastaMap[timer.toLowerCase()]);
    showPastaImage(timer.toLowerCase());
  }
  const plusBtn = document.getElementById("plusBtn");
  const minusBtn = document.getElementById("minusBtn");
  if (plusBtn) {
    plusBtn.onclick = function () {
      if (typeof remainingSeconds === "number" && remainingSeconds > 0) {
        remainingSeconds += 30;
        endTime += 30000;
        if (paused) {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          document.getElementById("timer").textContent = `${mins}:${
            secs < 10 ? "0" : ""
          }${secs}`;
          setCircleProgress((totalSeconds - remainingSeconds) / totalSeconds);
        }
      }
    };
  }
  if (minusBtn) {
    minusBtn.onclick = function () {
      if (typeof remainingSeconds === "number" && remainingSeconds > 0) {
        remainingSeconds = Math.max(0, remainingSeconds - 30);
        endTime = Math.max(Date.now(), endTime - 30000);
        if (remainingSeconds < 0) remainingSeconds = 0;
        if (paused) {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          document.getElementById("timer").textContent = `${mins}:${
            secs < 10 ? "0" : ""
          }${secs}`;
          setCircleProgress((totalSeconds - remainingSeconds) / totalSeconds);
        }
      }
    };
  }
};

function showPastaImage(pasta) {
  const photoContainer = document.getElementById("pastaPhoto");
  const knownPastas = ["spaghetti", "penne", "fusilli", "farfalle"];
  if (knownPastas.includes(pasta)) {
    photoContainer.innerHTML = `
      <img src="images/${pasta}.svg" alt="${pasta}" />
    `;
  } else {
    photoContainer.innerHTML = "";
  }
}
