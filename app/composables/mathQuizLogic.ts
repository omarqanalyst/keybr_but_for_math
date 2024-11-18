// composables/useQuiz.ts
import { ref, computed } from 'vue';

export function useQuiz() {
  // State variables
  const firstNumber = ref<number[]>([]);
  const secondNumber = ref<number[]>([]);
  const sumArray = computed(() =>
    firstNumber.value.map((num, index) => num + secondNumber.value[index])
  );

  // User inputs and states
  const userInputs = ref<string[]>([]);
  const inputStates = ref<string[]>([]);

  // Timing and scoring
  let startTime: number | null = null;
  const timerRunning = ref(false);
  const lastCorrectTime = ref<number | null>(null);
  const score = ref<string | null>(null);

  // Attempts and correct times
  const attemptsArray = ref<number[][]>([]);
  const correctTimes = ref<(number | null)[]>([]);

  // Initialize function
  const initializeQuiz = () => {
    firstNumber.value = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
    secondNumber.value = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
    userInputs.value = Array(10).fill('');
    inputStates.value = Array(10).fill('');
    attemptsArray.value = Array.from({ length: 10 }, () => []);
    correctTimes.value = Array(10).fill(null);
    startTime = null;
    timerRunning.value = false;
    lastCorrectTime.value = null;
    score.value = null;
  };

  // Call initializeQuiz when the composable is first used
  initializeQuiz();

  // Start and stop timer functions
  const startTimer = () => {
    if (!timerRunning.value) {
      startTime = Date.now();
      lastCorrectTime.value = startTime;
      timerRunning.value = true;
    }
  };

   // User performance data array
   const userPerformanceData = ref([]);

   const stopTimer = () => {
     if (startTime) {
       const endTime = Date.now();
       score.value = ((endTime - startTime) / 1000).toFixed(2);
       timerRunning.value = false;
 
       // Collect data
       const questionData = firstNumber.value.map((num, index) => ({
         timeStamp: new Date().toISOString(),
         firstNumber: num,
         secondNumber: secondNumber.value[index],
         timeTakenToAnswerCorrectly: correctTimes.value[index],
         userValue: summary.value[index].attempts.length === 1 ? null : summary.value[index].attempts.attempts.slice(0, -1),
         isCorrect: inputStates.value[index] === 'correct',
       }));

 
       // Store data locally
       userPerformanceData.value.push({
         totalTimeTaken: parseFloat(score.value),
         questions: questionData,
       });
     }
   };

  // Check answer function
  const checkAnswer = (index: number): boolean => {
    const userValue = parseInt(userInputs.value[index]);
    attemptsArray.value[index].push(userValue);
    const isCorrect = userValue === sumArray.value[index];
    inputStates.value[index] = isCorrect ? 'correct' : 'incorrect';

    if (isCorrect) {
      const currentTime = Date.now();
      if (correctTimes.value[index] === null && startTime) {
        correctTimes.value[index] = (currentTime - (lastCorrectTime.value || startTime)) / 1000;
        lastCorrectTime.value = currentTime;
      }
      if (index === sumArray.value.length - 1) {
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
        errors + attempts.filter((a) => a !== sumArray.value[index]).length,
      0
    )
  );

  // Summary and data for tables
  const summary = computed(() =>
    attemptsArray.value.map((attempts, index) => ({
      question: `${firstNumber.value[index]} + ${secondNumber.value[index]}`,
      correctAnswer: sumArray.value[index],
      attempts,
      wasIncorrect: attempts.some((a) => a !== sumArray.value[index]),
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
            question: `${firstNumber.value[index]} + ${secondNumber.value[index]}`,
            timeTaken: time.toFixed(2),
          };
        }
        return null;
      })
      .filter(Boolean)
  );

  const progressReportRows = computed(() =>
    attemptsArray.value.map((attempts, index) => {
      // Use toRaw to unwrap the Proxy object
      const rawAttempts = toRaw(attempts);
  
      const correctAnswer = sumArray.value[index];
      const incorrectAttempts = rawAttempts.filter((a) => a !== correctAnswer);

      // console.log('Attempts')
      // console.log(attempts)
      // console.log('rawAttempts: ', rawAttempts.join(', '))
      // console.log('Attempts: ', attempts.join(', '))

  
      return {
        firstNumber: firstNumber.value[index],
        secondNumber: secondNumber.value[index],
        correctAnswer,
        // Display raw attempts
        allAttempts: rawAttempts.join(', '),
        // allAttempts: attempts.join(', '),
        // Show incorrect attempts
        incorrectAttempts: incorrectAttempts.join(', ') || 'None',
        // Determine correctness
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

  // Return all your variables and functions, including initializeQuiz
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
    initializeQuiz,
    userPerformanceData, // Return this to access it in your component
    stopTimer,
  };
}
