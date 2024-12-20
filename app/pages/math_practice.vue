<template>
  <UPage>
    <UPageBody>
      <div class="flex justify-center">
        <!-- Card Container -->
        <div class="w-1/3">

          
          <UPageCard title="Start quiz"/>
          

          <div class="mt-4">
            <UButton @click="refreshQuiz" class="mt-4">Refresh</UButton>
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
                @keydown.enter="onEnterKey(index)"
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
            <UTable :columns="columnsIncorrect" :rows="incorrectAttemptsRows" />

            <h3 class="mt-6 text-lg font-semibold">Time for Each Correct Answer</h3>
            <UTable :columns="columnsTime" :rows="timeTableRows" />

            <h3 class="mt-6 text-lg font-semibold">Progress Report</h3>
            <UTable :columns="columnsProgress" :rows="progressReportRows" />

            <h6 class="mt-6 text-lg font-semibold">Incorrect Questions: Unique Ones Digits</h6>
            <UTable :columns="columnsUniqueOnesDigits" :rows="uniqueOnesDigitsWithCounts" />
            <div v-if="userPerformanceData.length" class="mt-6">
            <h3 class="text-lg font-semibold">User Progress</h3>
            <div v-for="(quiz, quizIndex) in userPerformanceData" :key="quizIndex" class="mt-4">
              <h4>Quiz {{ quizIndex + 1 }} - Total Time: {{ quiz.totalTimeTaken }} seconds</h4>
              <UTable :columns="columnsUserProgress" :rows="quiz.questions" />
            </div>
          </div>
          </div>
          

          <UPageCard title="Start Quiz">
            <!-- Parameters Section -->
            <div class="mb-4">
              <label class="block mb-2">Number of Questions:</label>
              <UInput v-model.number="numberOfQuestions"
                type="number"
                min="1"
                max="100" />

              <label class="block mt-4 mb-2">Maximum Digit Count:</label>
              <USelect v-model.number="numberOfDigits" :options="digitOptions" />
            </div>
            <!-- New Parameter: Exact Digit Count -->
            <div class="mt-4">
                <label class="block mt-4 mb-2">Exact Digit Count</label>
                <UCheckbox v-model="exactDigitCount"/>
              </div>

            <!-- New Parameter: Exclude Numbers Ending with Zero -->
            <div class="mt-2">
              <label class="block mt-4 mb-2">Exclude Numbers Ending with Zero</label>
              <UCheckbox
                v-model="excludeEndingZero"
                :disabled="selectedEndingDigits.includes(0)"
              >
              </UCheckbox>
            </div>

            <!-- New Parameter: Select Numbers Ending with Specific Digits -->
            <div class="mt-4">
              <label class="block mb-2 font-semibold">Numbers Ending With:</label>
              <div class="grid grid-cols-5 gap-2">
                <UCheckbox
                  v-for="digit in endingDigitsOptions"
                  :key="digit"
                  :value="digit"
                  v-model="selectedEndingDigits"
                  :disabled="excludeEndingZero && digit === 0 || (numberOfDigits === 1 && digit === 0)"
                  >
                  <template #label>
                    <span>{{ digit }}</span>
                  </template>
                </UCheckbox>
              </div>
            </div>
          </UPageCard>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>


<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { mathQuizLogic } from '~/composables/mathQuizLogic';


const {
  numberOfQuestions,
  numberOfDigits,
  exactDigitCount,
  excludeEndingZero,
  selectedEndingDigits,
  firstNumber,
  secondNumber,
  sumArray,
  userInputs,
  inputStates,
  checkAnswer,
  startTimer,
  totalAttempts,
  totalErrors,
  score,
  incorrectAttemptsRows,
  timeTableRows,
  progressReportRows,
  uniqueOnesDigitsWithCounts,
  initializeQuiz,
  userPerformanceData,
  stopTimer,
} = useQuiz();

// New state for user-configurable parameters
const digitOptions = [
  { value: 1, label: 'Single Digits (1-9)' },
  { value: 2, label: 'Tens (1-99)' },
  { value: 3, label: 'Hundreds (1-999)' },
  { value: 4, label: 'Thousands (1-9999)' },
];

// Options for ending digits (0-9)
const endingDigitsOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const inputRefs = ref([]);


const columnsUserProgress = [
  { key: 'timeStamp', label: 'Time Stamp' },
  { key: 'firstNumber', label: 'First Number' },
  { key: 'secondNumber', label: 'Second Number' },
  { key: 'correctAnswer', label: 'Correct Answer' }, // Added to show the expected answer
  { key: 'allAttempts', label: 'All Attempts' }, // New column for debugging (all user attempts)
  { key: 'incorrectAttempts', label: 'Incorrect Attempts' }, // New column to show only incorrect answers
  { key: 'isCorrect', label: 'Correct?' },
  { key: 'timeTakenToAnswerCorrectly', label: 'Time Taken (s)' },
];


const columnsIncorrect = [
  { key: 'questionMissed', label: 'Question Missed' },
  { key: 'numberOfIncorrectAttempts', label: 'Number of Incorrect Attempts' },
  { key: 'attempts', label: 'Incorrect Attempts' },
];

const columnsTime = [
  { key: 'question', label: 'Question' },
  { key: 'timeTaken', label: 'Time Taken (seconds)' },
];

const columnsProgress = [
  { key: 'firstNumber', label: 'First Number' },
  { key: 'secondNumber', label: 'Second Number' },
  { key: 'correctAnswer', label: 'Correct Answer' },
  { key: 'incorrectAttempts', label: 'Incorrect Attempts' },
  { key: 'isCorrect', label: 'Is Correct' },
];

const columnsUniqueOnesDigits = [
  { key: 'digit', label: 'Unique Ones Digit' },
  { key: 'count', label: 'Count' },
];

const refreshQuiz = () => {
  initializeQuiz();
  // Optionally focus the first input
  if (inputRefs.value[0]) {
    nextTick(() => {
      const inputEl = inputRefs.value[0].$el.querySelector('input');
      if (inputEl) {
        inputEl.focus();
      }
    });
  }
};

const onKeyUp = (event) => {
  if (event.key === 'Escape') {
    refreshQuiz();
  }
};

onMounted(() => {
  window.addEventListener('keyup', onKeyUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('keyup', onKeyUp);
});

const onEnterKey = async (index: number) => {
  const isCorrect = checkAnswer(index);
  if (isCorrect) {
    if (index === sumArray.length - 1) {
      // Last question answered correctly
      stopTimer();
    } else {
      const nextInputComponent = inputRefs.value[index + 1];
      if (nextInputComponent) {
        await nextTick();
        const inputEl = nextInputComponent.$el.querySelector('input');
        if (inputEl) {
          inputEl.focus();
        }
      }
    }
  } else {
    // Keep focus on the current input
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
</script>
