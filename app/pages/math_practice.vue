<template>
  <UPage>
    <UPageBody>
      <div class="flex justify-center">
        <!-- Card Container -->
        <div class="w-1/3">
          <UPageCard title="Random Arrays with Input Validation" />
          <div class="mt-4">
            <div
              v-for="(sum, index) in sumArray"
              :key="index"
              class="flex items-center justify-between mt-2"
            >
              <p class="mr-4">{{ firstNumber[index] }} + {{ secondNumber[index] }} = </p>
              <UInput
                v-model="userInputs[index]"
                class="w-16"
                :class="{
                  'ring-2 ring-green-300': inputStates[index] === 'correct',
                  'ring-2 ring-red-300': inputStates[index] === 'incorrect',
                }"
                @keydown.enter="checkAnswer(index)"
                @input="startTimer"
                ref="inputRefs"
                :ref-for="true"
              />
            </div>
          </div>
          <div v-if="score !== null" class="mt-6 text-center">
            <p>Your score: {{ score }} seconds</p>
            <p>Total attempts: {{ totalAttempts }}</p>
            <p>Total errors: {{ totalErrors }}</p>

            <h3 class="mt-6 text-lg font-semibold">Incorrect Attempts</h3>
            <UTable :columns="columnsIncorrect" :rows="rowsIncorrect" />

            <h3 class="mt-6 text-lg font-semibold">Time for Each Correct Answer</h3>
            <UTable :columns="columnsTime" :rows="rowsTime" />

            <h3 class="mt-6 text-lg font-semibold">Progress Report</h3>
            <UTable :columns="columnsProgress" :rows="rowsProgress" />

            <h6 class="mt-6 text-lg font-semibold">Incorrect Questions: Unique Ones Digits</h6>
            <UTable :columns="columnsUniqueOnesDigits" :rows="rowsUniqueOnesDigits" />
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
// Import UTable if not globally registered

// Generate two arrays of random digits
const firstNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
const secondNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));

// Generate a third array as the sum of the first two
const sumArray = firstNumber.map((num, index) => num + secondNumber[index]);

// Create an array of user inputs for each sum
const userInputs = ref(Array(10).fill(''));

// Track input states ('correct', 'incorrect', or '')
const inputStates = ref(Array(10).fill(''));

// Timer variables
let startTime: number | null = null;
const timerRunning = ref(false);
const score = ref<string | null>(null);

// Array to hold references to input components
const inputRefs = ref([]);

// Array to track attempts for each question
const attemptsArray = ref(Array.from({ length: 10 }, () => []));

// Array to track time for each correct answer
const correctTimes = ref(Array(10).fill(null));
const lastCorrectTime = ref(startTime); // Tracks the last correct answer time

// Computed property for total attempts
const totalAttempts = computed(() => {
  return attemptsArray.value.reduce((sum, attempts) => sum + attempts.length, 0);
});

// Computed property for total errors
const totalErrors = computed(() => {
  return summary.value.filter((item) => item.wasIncorrect).length;
});

// Computed property for summary
const summary = computed(() => {
  return attemptsArray.value.map((attempts, index) => {
    const correctAnswer = sumArray[index];
    return {
      question: `${firstNumber[index]} + ${secondNumber[index]}`,
      correctAnswer: correctAnswer,
      attempts: attempts,
      attemptsCount: attempts.length,
      wasIncorrect: attempts.some((a) => a !== correctAnswer),
    };
  });
});

// Define the columns and rows for the Incorrect Attempts table
const columnsIncorrect = ref([
  { key: 'questionMissed', label: 'Question Missed' },
  { key: 'numberOfIncorrectAttempts', label: 'Number of Incorrect Attempts' },
  { key: 'attempts', label: 'Incorrect Attempts' },
]);

const rowsIncorrect = ref([]);

// Define the columns and rows for the Time Tracking table
const columnsTime = ref([
  { key: 'question', label: 'Question' },
  { key: 'timeTaken', label: 'Time Taken (seconds)' },
]);

const rowsTime = ref([]);

// Define columns and rows for the Progress Report table
const columnsProgress = ref([
  { key: 'firstNumber', label: 'First Number' },
  { key: 'secondNumber', label: 'Second Number' },
  { key: 'correctAnswer', label: 'Correct Answer' },
  { key: 'incorrectAttempts', label: 'Incorrect Attempts' },
  { key: 'isCorrect', label: 'Is Correct' },
]);

const rowsProgress = computed(() =>
  dataframe.value.map((row) => ({
    firstNumber: row.firstNumber,
    secondNumber: row.secondNumber,
    correctAnswer: row.correctAnswer,
    incorrectAttempts: row.incorrectAttempts || 'None',
    isCorrect: row.isCorrect ? 'Yes' : 'No',
  }))
);

// Define columns and rows for the Unique Ones Digits table
const columnsUniqueOnesDigits = ref([
  { key: 'digit', label: 'Unique Ones Digit' },
  { key: 'count', label: 'Count' },
]);

const rowsUniqueOnesDigits = computed(() =>
  uniqueOnesDigitsWithCounts.value.map((row) => ({
    digit: row.digit,
    count: row.count,
  }))
);

// Function to calculate rows for the Incorrect Attempts table
const calculateIncorrectTableRows = () => {
  rowsIncorrect.value = summary.value
    .filter((item) => item.wasIncorrect)
    .map((item) => {
      const correctAnswer = item.correctAnswer;
      const incorrectAttempts = item.attempts.filter((attempt) => attempt !== correctAnswer);
      return {
        questionMissed: item.question,
        numberOfIncorrectAttempts: incorrectAttempts.length,
        attempts: incorrectAttempts.join(', '),
      };
    });
};

// Function to calculate rows for the Time Tracking table
const calculateTimeTableRows = () => {
  rowsTime.value = correctTimes.value
    .map((time, index) => {
      if (time !== null) {
        return {
          question: `${firstNumber[index]} + ${secondNumber[index]}`,
          timeTaken: time.toFixed(2),
        };
      }
      return null;
    })
    .filter((row) => row !== null);
};

// Watcher to update the Incorrect Attempts table
watch(
  () => attemptsArray.value,
  () => {
    calculateIncorrectTableRows();
  },
  { deep: true }
);

// Watcher to update the Time Tracking table
watch(
  () => correctTimes.value,
  () => {
    calculateTimeTableRows();
  },
  { deep: true }
);

// Function to check the answer and change colors
const checkAnswer = async (index: number) => {
  const userValue = parseInt(userInputs.value[index]);

  // Record the attempt
  attemptsArray.value[index].push(userValue);

  const isCorrect = userValue === sumArray[index];

  // Update the input state
  inputStates.value[index] = isCorrect ? 'correct' : 'incorrect';

  if (isCorrect) {
    // Record the time for the correct answer
    const currentTime = Date.now();
    if (!correctTimes.value[index] && startTime) {
      if (lastCorrectTime.value) {
        correctTimes.value[index] = (currentTime - lastCorrectTime.value) / 1000; // Time since last correct answer
      } else {
        correctTimes.value[index] = (currentTime - startTime) / 1000; // Time since quiz started
      }
      lastCorrectTime.value = currentTime; // Update the last correct time
    }

    // Check if this is the last input
    if (index === sumArray.length - 1) {
      stopTimer();
    }

    // Move to the next input box if it exists
    const nextInputComponent = inputRefs.value[index + 1];
    if (nextInputComponent) {
      await nextTick();
      const inputEl = nextInputComponent.$el.querySelector('input');
      if (inputEl) {
        inputEl.focus();
      }
    }
  } else {
    // Clear the input field
    userInputs.value[index] = '';
    // Refocus on the same input field
    const currentInputComponent = inputRefs.value[index];
    if (currentInputComponent) {
      await nextTick();
      const inputEl = currentInputComponent.$el.querySelector('input');
      if (inputEl) {
        inputEl.focus();
      }
    }
  }
};

const dataframe = computed(() => {
  return firstNumber.map((value1, index) => {
    const value2 = secondNumber[index];
    const correctAnswer = sumArray[index];
    const allAttempts = attemptsArray.value[index];

    // Filter out incorrect attempts
    const incorrectAttemptsArray = allAttempts.filter((attempt) => attempt !== correctAnswer);

    // Join incorrect attempts into a string
    const incorrectAttempts = incorrectAttemptsArray.join(', ');

    // Set isCorrect: 1 if no incorrect attempts, else 0
    const isCorrect = incorrectAttemptsArray.length === 0 ? 1 : 0;

    return {
      firstNumber: value1,
      secondNumber: value2,
      correctAnswer: correctAnswer,
      incorrectAttempts: incorrectAttempts,
      isCorrect: isCorrect,
    };
  });
});

const failedQuestions = computed(() => {
  return dataframe.value
    .filter((row) => row.isCorrect === 0)
    .map((row) => ({
      firstNumber: row.firstNumber,
      secondNumber: row.secondNumber,
    }));
});

const uniqueOnesDigitsWithCounts = computed(() => {
  const digitCounts = {};

  failedQuestions.value.forEach((question) => {
    const lastDigitFirstNumber = question.firstNumber % 10;
    const lastDigitSecondNumber = question.secondNumber % 10;

    // If last digits are the same, count only once
    if (lastDigitFirstNumber === lastDigitSecondNumber) {
      digitCounts[lastDigitFirstNumber] = (digitCounts[lastDigitFirstNumber] || 0) + 1;
    } else {
      // Otherwise, count each digit separately
      digitCounts[lastDigitFirstNumber] = (digitCounts[lastDigitFirstNumber] || 0) + 1;
      digitCounts[lastDigitSecondNumber] = (digitCounts[lastDigitSecondNumber] || 0) + 1;
    }
  });

  // Convert the object into an array of { digit, count }
  return Object.entries(digitCounts).map(([digit, count]) => ({
    digit: parseInt(digit, 10),
    count,
  }));
});

// Function to start the timer
const startTimer = () => {
  if (!timerRunning.value) {
    startTime = Date.now();
    lastCorrectTime.value = startTime; // Initialize the last correct time with start time
    timerRunning.value = true;
  }
};

// Function to stop the timer and calculate the score
const stopTimer = () => {
  if (startTime) {
    const endTime = Date.now();
    score.value = ((endTime - startTime) / 1000).toFixed(2); // Convert to seconds
    timerRunning.value = false;
  }
};
</script>
