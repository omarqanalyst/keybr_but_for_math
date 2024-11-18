// composables/useQuiz.ts
import { ref, computed } from 'vue';

export function useQuiz() {
  // Reactive variables for quiz settings
  const numberOfQuestions = ref(10);
  const numberOfDigits = ref(1); // Default to single-digit numbers
  const exactDigitCount = ref(false); // New parameter for exact digit count
  const excludeEndingZero = ref(false); // New parameter to exclude numbers ending with zero
  const selectedEndingDigits = ref<number[]>([]); // New parameter for selected ending digits


  // State variables
  const firstNumber = ref<number[]>([]);
  const secondNumber = ref<number[]>([]);
  const sumArray = computed(() =>
    firstNumber.value.map((num, index) => num + secondNumber.value[index])
  );

    // Watcher to clear selectedEndingDigits when switching to single digits
    watch(numberOfDigits, (newVal) => {
      if (newVal === 1) {
        selectedEndingDigits.value = [];
      }
    });

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
    let minNumber = exactDigitCount.value
      ? Math.pow(10, numberOfDigits.value - 1)
      : 0;
    let maxNumber = Math.pow(10, numberOfDigits.value) - 1;

    // For single-digit numbers, ensure minNumber is 1
    if (numberOfDigits.value === 1) {
      minNumber = 1;
    }

    firstNumber.value = generateNumbers(minNumber, maxNumber);
    secondNumber.value = generateNumbers(minNumber, maxNumber);
    userInputs.value = Array(numberOfQuestions.value).fill('');
    inputStates.value = Array(numberOfQuestions.value).fill('');
    attemptsArray.value = Array.from({ length: numberOfQuestions.value }, () => []);
    correctTimes.value = Array(numberOfQuestions.value).fill(null);
    startTime = null;
    timerRunning.value = false;
    lastCorrectTime.value = null;
    score.value = null;
  };

  // Function to generate numbers based on the parameters
  const generateNumbers = (min: number, max: number): number[] => {
    const numbers: number[] = [];
    while (numbers.length < numberOfQuestions.value) {
      let num = Math.floor(Math.random() * (max - min + 1)) + min;

      // If exactDigitCount is true, ensure num has the exact number of digits
      if (exactDigitCount.value && num.toString().length !== numberOfDigits.value) {
        continue;
      }

      // If excludeEndingZero is true, ensure num does not end with zero
      if (excludeEndingZero.value && num % 10 === 0) {
        continue;
      }
      // If selectedEndingDigits is not empty, ensure num ends with one of the selected digits
      if (selectedEndingDigits.value.length > 0) {
        const lastDigit = num % 10;
        if (!selectedEndingDigits.value.includes(lastDigit)) {
          continue;
        }
      }

      numbers.push(num);
    }
    return numbers;
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
      const questionData = firstNumber.value.map((num, index) => {
        const attempts = summary.value[index].attempts;
        const incorrectAttempts = attempts.length === 1 ? [] : attempts.slice(0, -1);
        const correctAnswer = num + secondNumber.value[index]; 


        return {
          timeStamp: new Date().toISOString(),
          firstNumber: num,
          correctAnswer: correctAnswer,
          secondNumber: secondNumber.value[index],
          timeTakenToAnswerCorrectly: correctTimes.value[index],
          allAttempts: attempts,
          incorrectAttempts: incorrectAttempts.length > 0 ? `[${incorrectAttempts.join(', ')}]` : "",
          isCorrect: incorrectAttempts.length === 0 ? 'Yes' : 'No',
        };
      });
      
       console.log("f1:", questionData)
 
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

  
      return {
        firstNumber: firstNumber.value[index],
        secondNumber: secondNumber.value[index],
        correctAnswer,
        // Display raw attempts
        allAttempts: rawAttempts.join(', '),
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
    numberOfQuestions,
    numberOfDigits,
    exactDigitCount,
    excludeEndingZero,
    selectedEndingDigits,
  };
}
