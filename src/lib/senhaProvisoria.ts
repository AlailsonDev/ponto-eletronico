/** Gera uma senha provisória legível (evita caracteres ambíguos como 0/O, 1/l). */
export function gerarSenhaProvisoria(): string {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return senha;
}
