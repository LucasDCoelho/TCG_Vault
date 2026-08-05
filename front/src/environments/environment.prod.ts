export const environment = {
  production: true,
  // Sessão via cookie HttpOnly: o front precisa falar DIRETO com o back (cross-origin,
  // com credenciais). Cookie não atravessa o proxy do Vercel. Ajuste para a URL real.
  apiBase: 'https://tcg-vault-api.onrender.com',
};
