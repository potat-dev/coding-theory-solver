"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { analyzeArray } from "@/lib/math";

type Result = {
  title: string;
  content: string[];
};

export default function ErrorCorrectionApp() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Result[]>([]);

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
          content: ["Введите данные"],
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
          <div className="flex justify-between items-center">
            <CardTitle>Решатор Трофимова 3000</CardTitle>
            <ModeToggle />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="input" className="text-muted-foreground">
              Вставьте числа, разделенные запятыми. Или пробелами. Или без
              разделителей, мне похуй вообще.
            </Label>
            <Input
              id="input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1,1,0,0,1,1,0,1,0,0,1,1,1,0,0"
              className="font-mono"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button className="w-full" onClick={handleSubmit}>
            Анализировать
          </Button>
        </CardFooter>
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
