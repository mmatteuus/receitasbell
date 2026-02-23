"use client";

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'receitas_bell_ratings';

export function useRecipeRating(recipeId: string) {
  const [userRating, setUserRating] = useState<number>(0);
  
  // Dados simulados para a média (apenas visual)
  const [averageRating, setAverageRating] = useState(4.5);
  const [totalVotes, setTotalVotes] = useState(12);

  useEffect(() => {
    // Carregar avaliação do usuário
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const ratings = JSON.parse(stored);
        if (ratings[recipeId]) {
          setUserRating(ratings[recipeId]);
        }
      } catch (e) {
        console.error("Erro ao ler avaliações", e);
      }
    }

    // Gerar dados determinísticos baseados no ID para a demo
    const idNum = recipeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    setAverageRating(4 + (idNum % 10) / 10); // Entre 4.0 e 4.9
    setTotalVotes(10 + (idNum % 50));
  }, [recipeId]);

  const rate = (value: number) => {
    setUserRating(value);
    
    const stored = localStorage.getItem(STORAGE_KEY) || '{}';
    const ratings = JSON.parse(stored);
    ratings[recipeId] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  };

  return { userRating, averageRating, totalVotes, rate };
}