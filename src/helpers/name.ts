export function generatePermutations(words: string[]): string[][] {
  if (words.length === 1) return [words];

  const result: string[][] = [];

  words.forEach((word, index) => {
    const remainingWords = [...words.slice(0, index), ...words.slice(index + 1)];
    const perms = generatePermutations(remainingWords);

    perms.forEach((perm) => {
      result.push([word, ...perm]);
    });
  });

  return result;
}

export function isNameValid(name: string, resName: string): boolean {
  const nameWords = name.toUpperCase().split(' ').filter(Boolean);
  const resNameWords = resName.toUpperCase().split(' ').filter(Boolean);

  const permutations = generatePermutations(nameWords);

  for (const perm of permutations) {
    let matchCount = 0;

    for (const word of perm) {
      if (resNameWords.includes(word)) {
        matchCount++;
      }
    }

    if (matchCount >= 2) return true;
  }

  return false;
}
