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
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useQuiz } from '~/composables/mathQuizLogic';

const {
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
} = useQuiz();

const inputRefs = ref([]);

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

const onEnterKey = async (index: number) => {
  const isCorrect = checkAnswer(index);
  if (isCorrect) {
    const nextInputComponent = inputRefs.value[index + 1];
    if (nextInputComponent) {
      await nextTick();
      const inputEl = nextInputComponent.$el.querySelector('input');
      if (inputEl) {
        inputEl.focus();
      }
    }
  } else {
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
