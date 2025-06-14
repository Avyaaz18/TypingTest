// App state
let appState = {
  defaultText: "Type to start",
  allTexts: [],
  currentText: "Type to start",
  correctText: "",
  mistakes: 0,
  minutes: 1,
  seconds: 0,
  timer: null,
  hasStarted: false
};

// Get random text from array
const getRandomText = () => {
  if (appState.allTexts.length === 0) return appState.defaultText;
  const randomIndex = Math.floor(Math.random() * appState.allTexts.length);
  return appState.allTexts[randomIndex];
};

// Load texts from JSON file
const loadTexts = async () => {
  try {
    const response = await fetch('para.json');
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    appState.allTexts = data.paragraphs;
    
    if (appState.allTexts.length > 0) {
      appState.defaultText = getRandomText();
      document.querySelector(".p-text").textContent = appState.defaultText;
      appState.currentText = appState.defaultText;
    }
  } catch (error) {
    console.error("Failed to load texts:", error);
  }
};

// Load saved settings
const loadSettings = () => {
  const savedMinutes = localStorage.getItem("minuteValue");
  if (savedMinutes) {
    appState.minutes = parseInt(savedMinutes);
  } else {
    localStorage.setItem("minuteValue", "1");
  }
};

// Format time with leading zero
const formatTime = (time) => time < 10 ? `0${time}` : time.toString();

// Update timer display
const updateTimerDisplay = () => {
  document.querySelector(".min").textContent = formatTime(appState.minutes);
  document.querySelector(".sec").textContent = formatTime(appState.seconds);
};

// Countdown timer
const countdown = () => {
  if (appState.seconds === 0) {
    appState.minutes--;
    appState.seconds = 59;
  } else {
    appState.seconds--;
  }
  
  updateTimerDisplay();
  
  if (appState.minutes === 0 && appState.seconds === 0) {
    clearInterval(appState.timer);
    finishTest();
  }
};

// Start timer
const startTimer = () => {
  appState.timer = setInterval(countdown, 1000);
};

// Handle typing input
const handleInput = () => {
  const fullInput = document.querySelector(".type-area").value;
  const currentInput = fullInput.replace(appState.correctText, "");
  
  if (currentInput.endsWith(" ")) {
    handleWordComplete();
    return;
  }
  
  highlightText(currentInput);
};

// Highlight current progress
const highlightText = (typed) => {
  if (!typed) {
    document.querySelector(".p-text").textContent = appState.defaultText;
    return;
  }
  
  // If only one word left
  if (!appState.currentText.includes(" ")) {
    if (appState.currentText.includes(typed)) {
      const highlighted = appState.currentText.replace(
        typed, 
        `<span class="highlight">${typed}</span>`
      );
      document.querySelector(".p-text").innerHTML = highlighted;
    }
    return;
  }
  
  // Get next word
  const nextWord = appState.currentText.substring(0, appState.currentText.indexOf(" ") + 1);
  
  if (nextWord.includes(typed)) {
    const highlighted = appState.currentText.replace(
      typed, 
      `<span class="highlight">${typed}</span>`
    );
    document.querySelector(".p-text").innerHTML = highlighted;
  } else {
    document.querySelector(".p-text").innerHTML = appState.currentText;
  }
};

// Handle word completion
const handleWordComplete = () => {
  const fullInput = document.querySelector(".type-area").value;
  const typedWord = fullInput.replace(appState.correctText, "");
  
  // Handle last word
  if (!appState.currentText.includes(" ")) {
    if (appState.currentText === typedWord.trim()) {
      document.querySelector(".p-text").innerHTML = "";
      appState.correctText = fullInput;
      appState.currentText = "";
    } else {
      addError(typedWord);
    }
    return;
  }
  
  // Handle regular word
  const expectedWord = appState.currentText.substring(0, appState.currentText.indexOf(" ") + 1);
  
  if (expectedWord === typedWord) {
    appState.currentText = appState.currentText.replace(typedWord, "");
    document.querySelector(".p-text").innerHTML = appState.currentText;
    appState.correctText = fullInput;
  } else {
    addError(typedWord);
  }
};

// Add error to display
const addError = (word) => {
  document.querySelector(".error-bundle").innerHTML += `<span class="error-word">${word}</span> `;
  document.querySelector(".type-area").value = appState.correctText;
  appState.mistakes++;
  document.querySelector(".p-text").innerHTML = appState.currentText;
};

// Handle special keys
const handleKeydown = (event) => {
  if (event.key === "Enter") {
    document.querySelector(".type-area").value = appState.correctText;
    event.preventDefault();
    return false;
  }
  
  if (event.key === "Backspace") {
    const currentValue = document.querySelector(".type-area").value;
    if (currentValue === appState.correctText || appState.correctText.includes(currentValue)) {
      event.preventDefault();
      return false;
    }
  }
};

// Calculate WPM
const getWPM = (text, minutes) => {
  const chars = typeof text === 'string' ? text.length : text;
  return chars / 5 / minutes;
};

// Calculate CPM
const getCPM = (text, minutes) => {
  const chars = typeof text === 'string' ? text.length : text;
  return chars / minutes;
};

// Calculate accuracy
const getAccuracy = (correct, total) => {
  const correctCount = typeof correct === 'string' ? correct.length : correct;
  const totalCount = typeof total === 'string' ? total.length : total;
  return totalCount === 0 ? 100 : (correctCount / totalCount) * 100;
};

// Show results
const showResults = () => {
  const testTime = parseInt(localStorage.getItem("minuteValue") || "1");
  const correctText = appState.correctText;
  
  // Get error text
  const errorElements = document.querySelectorAll(".error-word");
  let errorText = "";
  errorElements.forEach(el => errorText += el.textContent + " ");
  
  const totalText = correctText + errorText;
  
  // Display results
  document.querySelector("#timer-wpm").textContent = getWPM(correctText, testTime).toFixed(2);
  document.querySelector("#timer-cpm").textContent = getCPM(totalText, testTime).toFixed(2);
  document.querySelector("#timer-accuracy").textContent = getAccuracy(correctText, totalText).toFixed(2);
  
  // Animate results
  document.querySelectorAll(".result-data").forEach(el => {
    el.classList.add("stat-update");
    setTimeout(() => el.classList.remove("stat-update"), 500);
  });
};

// Finish test
const finishTest = async () => {
  document.querySelector(".type-area").disabled = true;
  document.querySelector(".showbox").style.visibility = "visible";
  
  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  document.querySelector(".showbox").style.visibility = "collapse";
  document.querySelector("#time-mode").scrollIntoView();
  
  showResults();
};

// Reset test
const resetTest = () => {
  clearInterval(appState.timer);
  appState.hasStarted = false;
  
  // Get new text
  appState.defaultText = getRandomText();
  appState.currentText = appState.defaultText;
  appState.correctText = "";
  appState.mistakes = 0;
  appState.seconds = 0;
  appState.minutes = parseInt(localStorage.getItem("minuteValue") || "1");
  
  // Reset UI
  document.querySelector(".p-text").innerHTML = appState.defaultText;
  document.querySelector(".type-area").value = "";
  document.querySelector(".type-area").disabled = false;
  document.querySelector(".type-area").style.borderColor = "#A1A1AA";
  document.querySelector(".error-bundle").innerHTML = "";
  
  updateTimerDisplay();
  
  document.querySelector("#timer-wpm").textContent = "0";
  document.querySelector("#timer-cpm").textContent = "0";
  document.querySelector("#timer-accuracy").textContent = "0";
};

// Setup event listeners
const setupEvents = () => {
  // Start on focus
  document.querySelector(".type-area").addEventListener("focus", () => {
    if (!appState.hasStarted) {
      appState.hasStarted = true;
      startTimer();
    }
  });
  
  // Reset button
  document.querySelector(".reset-time-mode").addEventListener("click", resetTest);
  
  // Input handling
  document.querySelector(".type-area").addEventListener("input", handleInput);
  
  // Key handling
  document.querySelector(".type-area").addEventListener("keydown", handleKeydown);
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadTexts();
  loadSettings();
  setupEvents();
});