const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Formato "Bearer TOKEN"

  // 2. Se não houver token, bloqueia a requisição
  if (token == null) {
    return res
      .status(401)
      .json({ mensagem: "Acesso negado. Nenhum token fornecido." });
  }

  // 3. Verifica se o token é válido
  jwt.verify(token, process.env.JWT_SECRET, (err, usuarioDecodificado) => {
    if (err) {
      // Se o token for inválido ou expirado
      return res.status(403).json({ mensagem: "Token inválido ou expirado." });
    }

    // 4. Se o token for válido, anexa os dados do usuário à requisição
    // e deixa a requisição passar para a rota final.
    req.usuario = usuarioDecodificado;
    next(); // Chama a próxima função/rota
  });
}

module.exports = authMiddleware;
