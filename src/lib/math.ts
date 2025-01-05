export const GF = [
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
  [0, 0, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [1, 0, 1, 1],
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 1, 1],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
  [1, 1, 0, 1],
  [1, 0, 0, 1],
];

export const gradA = (bits: number[]) => {
  for (let i = 0; i < 15; i++) {
    if (GF[i].every((val, idx) => val === bits[idx])) {
      return i;
    }
  }
  return -1;
};

export const XOR = (a: number[], b: number[]) =>
  a.map((val, idx) => (val + b[idx]) % 2);

export const searchOneErr = (L1: number) => {
  const errors = [];
  for (let i = 0; i < 15; i++) {
    let La = [0, 0, 0, 1];
    La = XOR(La, GF[(L1 + i) % 15]);
    if (gradA(La) === -1) {
      errors.push(`Корень: a^${i}, Позиция ошибки: ${(15 - i) % 15}`);
    }
  }
  return errors;
};

export const searchTwoErr = (L1: number, L2: number) => {
  const errors = [];
  for (let i = 0; i < 15; i++) {
    let La = [0, 0, 0, 1];
    La = XOR(La, GF[(L1 + i) % 15]);
    La = XOR(La, GF[(L2 + i * 2) % 15]);
    if (gradA(La) === -1) {
      errors.push(`Корень: a^${i}, Позиция ошибки: ${(15 - i) % 15}`);
    }
  }
  return errors;
};

export const searchThreeErr = (L1: number, L2: number, L3: number) => {
  const errors = [];
  for (let i = 0; i < 15; i++) {
    let La = [0, 0, 0, 1];
    La = XOR(La, GF[(L1 + i) % 15]);
    La = XOR(La, GF[(L2 + i * 2) % 15]);
    La = XOR(La, GF[(L3 + i * 3) % 15]);
    if (gradA(La) === -1) {
      errors.push(`Корень: a^${i}, Позиция ошибки: ${(15 - i) % 15}`);
    }
  }
  return errors;
};

export const analyzeArray = (V: number[]) => {
  const steps = [];

  // Calculate syndromes
  let S1 = [0, 0, 0, 0];
  let S3 = [0, 0, 0, 0];
  let S5 = [0, 0, 0, 0];

  for (let i = 0; i < 15; i++) {
    if (V[i] === 1) {
      S1 = XOR(GF[i], S1);
      S3 = XOR(GF[(i * 3) % 15], S3);
      S5 = XOR(GF[(i * 5) % 15], S5);
    }
  }

  steps.push({
    title: "Вычисление синдромов",
    content: [
      `S1: ${S1.join(" ")}`,
      `S3: ${S3.join(" ")}`,
      `S5: ${S5.join(" ")}`,
    ],
  });

  const a1 = gradA(S1);
  const a3 = gradA(S3);
  const a5 = gradA(S5);

  steps.push({
    title: "Степени синдромов",
    content: [`S1 = a^${a1}`, `S3 = a^${a3}`, `S5 = a^${a5}`],
  });

  if (a1 === -1) {
    steps.push({
      title: "Результат",
      content: ["Ошибок нет"],
    });
    return steps;
  }

  if (a3 === -1 && a5 === -1) {
    steps.push({
      title: "Результат",
      content: ["Одна ошибка"],
    });
    steps.push({
      title: "Позиции ошибок",
      content: searchOneErr(a1),
    });
    return steps;
  }

  const L1 = GF[a1];
  steps.push({
    title: "Локатор ошибки L1",
    content: [`L1: ${L1.join(" ")}`],
  });

  const tmp2 = gradA(XOR(GF[(a1 * 3) % 15], S3));
  const tmp1 = gradA(XOR(GF[(a1 * 2 + a3) % 15], S5));

  if (tmp1 === -1 || tmp2 === -1) {
    const L2 = XOR(GF[(a3 + (15 - a1)) % 15], GF[(a1 * 3 + (15 - a1)) % 15]);
    const gradL2 = gradA(L2);

    if (gradL2 !== -1) {
      steps.push({
        title: "Две ошибки",
        content: searchTwoErr(a1, gradL2),
      });
    } else {
      steps.push({
        title: "Одна ошибка",
        content: searchOneErr(a1),
      });
    }
    return steps;
  }

  const L2 = GF[(tmp1 + (15 - tmp2)) % 15];
  const gradL2 = gradA(L2);

  if (gradL2 === -1) {
    steps.push({
      title: "Одна ошибка",
      content: searchOneErr(a1),
    });
    return steps;
  }

  const L3 = XOR(XOR(GF[(a1 * 3) % 15], S3), GF[(a1 + gradL2) % 15]);
  const gradL3 = gradA(L3);

  if (gradL3 !== -1) {
    steps.push({
      title: "Три ошибки",
      content: searchThreeErr(a1, gradL2, gradL3),
    });
  } else {
    steps.push({
      title: "Две ошибки",
      content: searchTwoErr(a1, gradL2),
    });
  }

  return steps;
};
