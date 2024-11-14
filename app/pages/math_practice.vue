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
            <p>Total attempts: {{ totalAttempts}}</p> 
            <p>Total errors: {{ totalErrors }}</p>
            <UTable :columns="columnsIncorrect" :rows="rowsIncorrect" />
            <h3 class="mt-6 text-lg font-semibold">Time for Each Correct Answer</h3>
            <UTable :columns="columnsTime" :rows="rowsTime" />

            <h3 class="mt-6 text-lg font-semibold">Progress Report</h3>
            <table class="table-auto border-collapse border border-gray-500">
              <thead>
                <tr>
                  <th class="border border-gray-500 px-4 py-2">First Number</th>
                  <th class="border border-gray-500 px-4 py-2">Second Number</th>
                  <th class="border border-gray-500 px-4 py-2">Correct Answer</th>
                  <th class="border border-gray-500 px-4 py-2">Incorrect Attempts</th>
                  <th class="border border-gray-500 px-4 py-2">Is Correct</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in dataframe" :key="index">
                  <td class="border border-gray-500 px-4 py-2">{{ row.firstNumber }}</td>
                  <td class="border border-gray-500 px-4 py-2">{{ row.secondNumber }}</td>
                  <td class="border border-gray-500 px-4 py-2">{{ row.correctAnswer }}</td>
                  <td class="border border-gray-500 px-4 py-2">{{ row.incorrectAttempts }}</td>
                  <td class="border border-gray-500 px-4 py-2">{{ row.isCorrect }}</td>
                </tr>
              </tbody>
            </table>

            <h3 class="mt-6 text-lg font-semibold">Incorrect Questions: Unique Ones Digits</h3>
            <table class="table-auto border-collapse border border-gray-500 mt-4">
              <thead>
                <tr>
                  <th class="border border-gray-500 px-4 py-2">Unique Ones Digit</th>
                  <th class="border border-gray-500 px-4 py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in uniqueOnesDigitsWithCounts" :key="index">
                  <td class="border border-gray-500 px-4 py-2 text-center">{{ row.digit }}</td>
                  <td class="border border-gray-500 px-4 py-2 text-center">{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue';

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

// Define the columns for the incorrect attempts table
const columnsIncorrect = ref([
  { key: 'questionMissed', label: 'Question Missed' },
  { key: 'numberOfIncorrectAttempts', label: 'Number of Incorrect Attempts' },
  { key: 'attempts', label: 'Incorrect Attempts' },
]);


// Rows for incorrect attempts table
const rowsIncorrect = ref([]);

// Define the columns for the time tracking table
const columnsTime = ref([
  { key: 'question', label: 'Question' },
  { key: 'timeTaken', label: 'Time Taken (seconds)' },
]);

// Rows for the time tracking table
const rowsTime = ref([]);

// Function to calculate rows for the incorrect attempts table
const calculateIncorrectTableRows = () => {
  rowsIncorrect.value = summary.value
    .filter((item) => item.wasIncorrect) // Only include questions with incorrect attempts
    .map((item) => {
      const correctAnswer = item.correctAnswer;
      const incorrectAttempts = item.attempts.filter((attempt) => attempt !== correctAnswer); // Only incorrect attempts
      return {
        questionMissed: item.question,
        numberOfIncorrectAttempts: incorrectAttempts.length, // Count of incorrect attempts
        attempts: incorrectAttempts.join(', '), // List incorrect attempts
      };
    });
};



// Function to calculate rows for the time tracking table
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

// Watcher to update the incorrect attempts table
watch(
  () => attemptsArray.value,
  () => {
    calculateIncorrectTableRows();
  },
  { deep: true }
);

// Watcher to update the time tracking table
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
