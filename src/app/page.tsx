"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GF = [
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

type result = {
  title: string;
  content: string[];
};

export default function ErrorCorrectionApp() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<result[]>([]);

  const gradA = (bits: number[]) => {
    for (let i = 0; i < 15; i++) {
      if (GF[i].every((val, idx) => val === bits[idx])) {
        return i;
      }
    }
    return -1;
  };

  const XOR = (a: number[], b: number[]) =>
    a.map((val, idx) => (val + b[idx]) % 2);

  const searchOneErr = (L1: number) => {
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

  const searchTwoErr = (L1: number, L2: number) => {
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

  const searchThreeErr = (L1: number, L2: number, L3: number) => {
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

  const analyzeArray = (V: number[]) => {
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

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const array = input.split(",").map((num) => parseInt(num.trim()));
    if (
      array.length !== 15 ||
      array.some((num) => isNaN(num) || (num !== 0 && num !== 1))
    ) {
      setResults([
        {
          title: "Ошибка",
          content: ["Введите 15 чисел (0 или 1), разделённых запятыми"],
        },
      ]);
      return;
    }
    setResults(analyzeArray(array));
  };

  return (
    <div className="p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Анализ кодов исправления ошибок</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">
                Введите 15 чисел (0 или 1), разделённых запятыми:
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="1,1,0,0,1,1,0,1,0,0,1,1,1,0,0"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Анализировать
            </button>
          </form>
        </CardContent>
      </Card>

      {results.map((step, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle>{step.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {step.content.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
