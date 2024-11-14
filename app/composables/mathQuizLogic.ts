// composables/useQuiz.ts
import { ref, computed } from 'vue';

export function useQuiz() {
  // Generate two arrays of random digits
  const firstNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
  const secondNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));

  // Sum array
  const sumArray = firstNumber.map((num, index) => num + secondNumber[index]);

  // User inputs and states
  const userInputs = ref(Array(10).fill(''));
  const inputStates = ref(Array(10).fill(''));

  // Timing and scoring
  let startTime: number | null = null;
  const timerRunning = ref(false);
  const lastCorrectTime = ref(startTime);
  const score = ref<string | null>(null);

  // Attempts and correct times
  const attemptsArray = ref(Array.from({ length: 10 }, () => []));
  const correctTimes = ref(Array(10).fill(null));

  // Start and stop timer functions
  const startTimer = () => {
    if (!timerRunning.value) {
      startTime = Date.now();
      lastCorrectTime.value = startTime;
      timerRunning.value = true;
    }
  };

  const stopTimer = () => {
    if (startTime) {
      const endTime = Date.now();
      score.value = ((endTime - startTime) / 1000).toFixed(2);
      timerRunning.value = false;
    }
  };

  // Check answer function
  const checkAnswer = (index: number): boolean => {
    const userValue = parseInt(userInputs.value[index]);
    attemptsArray.value[index].push(userValue);
    const isCorrect = userValue === sumArray[index];
    inputStates.value[index] = isCorrect ? 'correct' : 'incorrect';

    if (isCorrect) {
      const currentTime = Date.now();
      if (!correctTimes.value[index] && startTime) {
        correctTimes.value[index] = (currentTime - (lastCorrectTime.value || startTime)) / 1000;
        lastCorrectTime.value = currentTime;
      }
      if (index === sumArray.length - 1) {
        stopTimer();
      }
    } else {
      userInputs.value[index] = '';
    }
    return isCorrect;
  };

  // Computed properties for attempts and errors
  const totalAttempts = computed(() =>
    attemptsArray.value.reduce((sum, attempts) => sum + attempts.length, 0)
  );

  const totalErrors = computed(() =>
    attemptsArray.value.reduce(
      (errors, attempts, index) =>
        errors + attempts.filter((a) => a !== sumArray[index]).length,
      0
    )
  );

  // Summary and data for tables
  const summary = computed(() =>
    attemptsArray.value.map((attempts, index) => ({
      question: `${firstNumber[index]} + ${secondNumber[index]}`,
      correctAnswer: sumArray[index],
      attempts,
      wasIncorrect: attempts.some((a) => a !== sumArray[index]),
    }))
  );

  const incorrectAttemptsRows = computed(() =>
    summary.value
      .filter((item) => item.wasIncorrect)
      .map((item) => ({
        questionMissed: item.question,
        numberOfIncorrectAttempts: item.attempts.filter(
          (a) => a !== item.correctAnswer
        ).length,
        attempts: item.attempts.filter((a) => a !== item.correctAnswer).join(', '),
      }))
  );

  const timeTableRows = computed(() =>
    correctTimes.value
      .map((time, index) => {
        if (time !== null) {
          return {
            question: `${firstNumber[index]} + ${secondNumber[index]}`,
            timeTaken: time.toFixed(2),
          };
        }
        return null;
      })
      .filter(Boolean)
  );

  const progressReportRows = computed(() =>
    attemptsArray.value.map((attempts, index) => {
      const incorrectAttempts = attempts.filter((a) => a !== sumArray[index]);
      return {
        firstNumber: firstNumber[index],
        secondNumber: secondNumber[index],
        correctAnswer: sumArray[index],
        incorrectAttempts: incorrectAttempts.join(', ') || 'None',
        isCorrect: incorrectAttempts.length === 0 ? 'Yes' : 'No',
      };
    })
  );

  const uniqueOnesDigitsWithCounts = computed(() => {
    const digitCounts: Record<number, number> = {};
    progressReportRows.value
      .filter((row) => row.isCorrect === 'No')
      .forEach((row) => {
        [row.firstNumber, row.secondNumber].forEach((num) => {
          const digit = num % 10;
          digitCounts[digit] = (digitCounts[digit] || 0) + 1;
        });
      });
    return Object.entries(digitCounts).map(([digit, count]) => ({
      digit: parseInt(digit, 10),
      count,
    }));
  });

  return {
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
  };
}
