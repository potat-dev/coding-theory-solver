export const GF = [
  [0, 0, 0, 1], // α^0 = 1
  [0, 0, 1, 0], // α^1
  [0, 1, 0, 0], // α^2
  [1, 0, 0, 0], // α^3
  [0, 0, 1, 1], // α^4
  [0, 1, 1, 0], // α^5
  [1, 1, 0, 0], // α^6
  [1, 0, 1, 1], // α^7
  [0, 1, 0, 1], // α^8
  [1, 0, 1, 0], // α^9
  [0, 1, 1, 1], // α^10
  [1, 1, 1, 0], // α^11
  [1, 1, 1, 1], // α^12
  [1, 1, 0, 1], // α^13
  [1, 0, 0, 1], // α^14
];

// Вспомогательные функции
export const XOR = (a: number[], b: number[]) =>
  a.map((val, idx) => (val + b[idx]) % 2);

export const multGF = (a: number[], b: number[]): number[] => {
  const result = [0, 0, 0, 0];
  const gradA = findDegree(a);
  const gradB = findDegree(b);
  if (gradA === -1 || gradB === -1) return result;
  return GF[(gradA + gradB) % 15];
};

export const findDegree = (bits: number[]): number => {
  for (let i = 0; i < 15; i++) {
    if (GF[i].every((val, idx) => val === bits[idx])) {
      return i;
    }
  }
  return -1;
};

// Новая структура для хранения промежуточных результатов
export interface Step {
  title: string;
  content: string[];
  details?: Record<string, string | number[]>;
}

export const analyzeBCH = (V: number[]) => {
  const steps: Step[] = [];

  // 1. Вычисление всех синдромов S1-S6
  const syndromes = calculateSyndromes(V);
  steps.push({
    title: "1. Вычисление синдромов",
    content: [
      "Вычисляем компоненты синдрома S(1), S(2), ..., S(6):",
      ...Object.entries(syndromes).map(
        ([key, value]) =>
          `${key}: ${value.vector.join(" ")} = α^${value.degree}`
      ),
    ],
    details: {
      syndromes: JSON.stringify(syndromes),
    },
  });

  // 2. Построение системы уравнений для многочлена локаторов
  const locatorPolynomial = calculateLocatorPolynomial(syndromes);
  steps.push({
    title: "2. Построение многочлена локаторов ошибок",
    content: [
      "Λ(x) = " + formatPolynomial(locatorPolynomial),
      "Коэффициенты в степенях α:",
      ...Object.entries(locatorPolynomial).map(
        ([degree, coef]) => `λ${degree}: α^${findDegree(coef)}`
      ),
    ],
    details: {
      polynomial: JSON.stringify(locatorPolynomial),
    },
  });

  // 3. Поиск корней многочлена локаторов
  const roots = findPolynomialRoots(locatorPolynomial);
  steps.push({
    title: "3. Поиск корней многочлена локаторов",
    content: [
      "Корни многочлена Λ(x):",
      ...roots.map((root) => `x = α^${root}`),
    ],
    details: {
      roots: JSON.stringify(roots),
    },
  });

  // 4. Определение позиций ошибок
  const errorPositions = roots
    .map((root) => (15 - root) % 15)
    .sort((a, b) => a - b);
  steps.push({
    title: "4. Определение позиций ошибок",
    content: [
      `Число ошибок: ${errorPositions.length}`,
      "Позиции ошибок: " + errorPositions.join(", "),
    ],
    details: {
      positions: errorPositions,
    },
  });

  return steps;
};

function calculateSyndromes(V: number[]) {
  const syndromes: Record<string, { vector: number[]; degree: number }> = {};

  for (let i = 1; i <= 6; i++) {
    let Si = [0, 0, 0, 0];
    for (let j = 0; j < 15; j++) {
      if (V[j] === 1) {
        Si = XOR(Si, GF[(j * i) % 15]);
      }
    }
    syndromes[`S${i}`] = {
      vector: Si,
      degree: findDegree(Si),
    };
  }

  return syndromes;
}

interface LambdaType {
  [key: string]: number[]; // Index signature allows string keys
}

function calculateLocatorPolynomial(
  syndromes: Record<string, { vector: number[]; degree: number }>
) {
  // Используем алгоритм Берлекэмпа-Месси
  let L = 0; // текущая длина регистра
  let Lambda: LambdaType = { "0": GF[0] }; // текущий многочлен локаторов
  let LastLambda: LambdaType = { "0": GF[0] }; // предыдущий многочлен

  for (let r = 0; r < 6; r++) {
    let delta = [0, 0, 0, 0];
    // Вычисляем дискрепанси
    for (let j = 0; j <= L; j++) {
      if (Lambda[j.toString()] && syndromes[`S${r + 1 - j}`]) {
        delta = XOR(
          delta,
          multGF(Lambda[j.toString()], syndromes[`S${r + 1 - j}`].vector)
        );
      }
    }

    if (findDegree(delta) !== -1) {
      const newLambda = { ...Lambda };
      // Обновляем многочлен
      for (let j = 0; j <= r + 1; j++) {
        const term = LastLambda[j.toString()] || [0, 0, 0, 0];
        newLambda[j.toString()] = XOR(
          Lambda[j.toString()] || [0, 0, 0, 0],
          multGF(delta, term)
        );
      }

      if (2 * L <= r) {
        L = r + 1 - L;
        LastLambda = Lambda;
      }
      Lambda = newLambda;
    }
  }

  return Lambda;
}

function findPolynomialRoots(polynomial: Record<string, number[]>) {
  const roots: number[] = [];

  // Метод Ченя - проверяем все элементы поля
  for (let i = 0; i < 15; i++) {
    let sum = [...GF[0]]; // Начинаем с 1
    let power = [...GF[0]];

    // Вычисляем значение многочлена в точке α^i
    for (const [, coef] of Object.entries(polynomial)) {
      const term = multGF(coef, power);
      sum = XOR(sum, term);
      power = multGF(power, GF[i]); // Увеличиваем степень
    }

    // Если сумма равна 0, то нашли корень
    if (findDegree(sum) === -1) {
      roots.push(i);
    }
  }

  return roots;
}

function formatPolynomial(polynomial: Record<string, number[]>) {
  const terms: string[] = [];

  Object.entries(polynomial).forEach(([power, coef]) => {
    const degree = findDegree(coef);
    if (degree === -1) return; // Пропускаем нулевые коэффициенты

    if (power === "0") {
      terms.push(degree === 0 ? "1" : `α^${degree}`);
    } else {
      const coefStr = degree === 0 ? "" : `α^${degree}`;
      const xPower = power === "1" ? "x" : `x^${power}`;
      terms.push(`${coefStr}${xPower}`);
    }
  });

  return terms.join(" + ") || "0";
}
