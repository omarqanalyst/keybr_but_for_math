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
              <p class="mr-4">{{ array1[index] }} + {{ array2[index] }} = </p>
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
            <UTable :columns="columnsIncorrect" :rows="rowsIncorrect" />
            <h3 class="mt-6 text-lg font-semibold">Time for Each Correct Answer</h3>
            <UTable :columns="columnsTime" :rows="rowsTime" />
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue';

// Generate two arrays of random digits
const array1 = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
const array2 = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));

// Generate a third array as the sum of the first two
const sumArray = array1.map((num, index) => num + array2[index]);

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
  return attemptsArray.value.reduce((sum, attempts, index) => {
    const correctAnswer = sumArray[index];
    const numErrors = attempts.filter((a) => a !== correctAnswer).length;
    return sum + numErrors;
  }, 0);
});

// Computed property for summary
const summary = computed(() => {
  return attemptsArray.value.map((attempts, index) => {
    const correctAnswer = sumArray[index];
    return {
      question: `${array1[index]} + ${array2[index]}`,
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
  { key: 'numberOfAttempts', label: 'Number of Attempts' },
  { key: 'attempts', label: 'Attempts' },
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
    .map((item) => ({
      questionMissed: item.question,
      numberOfAttempts: item.attemptsCount,
      attempts: item.attempts.join(', '),
    }));
};

// Function to calculate rows for the time tracking table
const calculateTimeTableRows = () => {
  rowsTime.value = correctTimes.value
    .map((time, index) => {
      if (time !== null) {
        return {
          question: `${array1[index]} + ${array2[index]}`,
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
