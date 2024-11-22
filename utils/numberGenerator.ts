export interface GenerateNumberOptions {
    min: number; // Minimum number (inclusive)
    max: number; // Maximum number (inclusive)
    exactDigitCount?: boolean; // Whether the number should have an exact digit count
    excludeEndingZero?: boolean; // Whether numbers ending in zero should be excluded
    selectedEndingDigits?: number[]; // List of allowed ending digits
    count: number; // Number of random numbers to generate
  }
  
  export function generateNumbers(options: GenerateNumberOptions): number[] {
    const {
      min,
      max,
      exactDigitCount = false,
      excludeEndingZero = false,
      selectedEndingDigits = [],
      count,
    } = options;
  
    const numbers: number[] = [];
  
    while (numbers.length < count) {
      // Generate a random number between min and max
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
  
      // If exactDigitCount is true, ensure the number has the exact number of digits
      if (exactDigitCount && num.toString().length !== Math.ceil(Math.log10(max))) {
        continue;
      }
  
      // If excludeEndingZero is true, ensure the number does not end in zero
      if (excludeEndingZero && num % 10 === 0) {
        continue;
      }
  
      // If selectedEndingDigits is provided, ensure the number ends with one of these digits
      if (selectedEndingDigits.length > 0) {
        const lastDigit = num % 10;
        if (!selectedEndingDigits.includes(lastDigit)) {
          continue;
        }
      }
  
      // Add the number to the list
      numbers.push(num);
    }
  
    return numbers;
  }
  