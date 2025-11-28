// Generate unique random username in format: ElitePlayer_####
export const generateUsername = (): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 digits: 1000-9999
  return `ElitePlayer_${randomNumber}`;
};
