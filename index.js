// --- IMPORTAÇÕES DE BIBLIOTECAS ---
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { exec } = require("child_process");

// --- IMPORTAÇÕES LOCAIS ---
const { sequelize, testarConexao, Conteudo, Usuario } = require("./models");
const {
  buscarConteudo,
  buscarDetalhesPorId,
} = require("./services/tmdbService");
const {
  enviarEmailRecuperacao,
  enviarEmailNotificacao,
  enviarEmailNotificacaoFilme,
} = require("./services/emailService");
const authMiddleware = require("./middleware/authMiddleware");

// --- CONFIGURAÇÃO DO APP ---
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// =================================================================
// --- ROTAS PÚBLICAS (não precisam de login/token) ---
// =================================================================

app.get("/", (req, res) => res.send("<h1>API do Alerta de Lançamentos</h1>"));

app.get("/buscar", async (req, res) => {
  const termoDeBusca = req.query.termo;
  if (!termoDeBusca) {
    return res
      .status(400)
      .json({ mensagem: "Por favor, forneça um 'termo' para a busca." });
  }
  try {
    const resultados = await buscarConteudo(termoDeBusca);
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ mensagem: error.message });
  }
});

app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Nome, email e senha são obrigatórios." });
  }
  try {
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    const novoUsuario = await Usuario.create({ nome, email, senha: senhaHash });
    res
      .status(201)
      .json({
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
      });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ mensagem: "Este email já está em uso." });
    }
    console.error("Erro ao registrar usuário:", error);
    res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao registrar o usuário." });
  }
});

app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nome", "email"],
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro detalhado ao buscar usuários:", error);
    res.status(500).json({ mensagem: "Erro ao buscar usuários." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res
        .status(400)
        .json({ mensagem: "Email e senha são obrigatórios." });
    }
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensagem: "Email ou senha inválidos." });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: "Email ou senha inválidos." });
    }
    const payload = { id: usuario.id, nome: usuario.nome };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res
      .status(200)
      .json({ usuario: { id: usuario.id, nome: usuario.nome }, token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro interno no servidor." });
  }
});

// --- ROTAS DE RECUPERAÇÃO DE SENHA ---
app.post("/esqueci-senha", async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    if (usuario) {
      const payload = { id: usuario.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      enviarEmailRecuperacao(usuario.email, token).catch(console.error);
    }
    res
      .status(200)
      .json({
        mensagem:
          "Se um usuário com este email existir, um link de recuperação foi enviado.",
      });
  } catch (error) {
    console.error("Erro no fluxo de esqueci-senha:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
});

app.post("/redefinir-senha", async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) {
      return res
        .status(400)
        .json({ mensagem: "Token e nova senha são obrigatórios." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(novaSenha, saltRounds);
    await Usuario.update({ senha: senhaHash }, { where: { id: decoded.id } });
    res.status(200).json({ mensagem: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res
      .status(401)
      .json({
        mensagem:
          "Token inválido ou expirado. Por favor, solicite um novo link.",
      });
  }
});

// =================================================================
// --- ROTAS PROTEGIDAS (precisam de login e token JWT) ---
// =================================================================

app.post("/minha-lista", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { tmdbId, titulo, tipo } = req.body;
    if (!tmdbId || !titulo || !tipo) {
      return res
        .status(400)
        .json({ mensagem: "tmdbId, titulo e tipo são obrigatórios." });
    }
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res
        .status(404)
        .json({ mensagem: "Usuário (do token) não encontrado." });
    }
    const [conteudo] = await Conteudo.findOrCreate({
      where: { tmdb_id: tmdbId },
      defaults: { titulo, tipo },
    });
    await usuario.addConteudo(conteudo);
    res
      .status(200)
      .json({
        mensagem: `'${conteudo.titulo}' adicionado à sua lista com sucesso!`,
      });
  } catch (error) {
    console.error("Erro ao adicionar conteúdo à lista:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
});

app.get("/minha-lista", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await Usuario.findByPk(usuarioId, { include: [Conteudo] });
    if (!usuario) {
      return res
        .status(404)
        .json({ mensagem: "Usuário (do token) não encontrado." });
    }
    res.status(200).json(usuario.Conteudos || []);
  } catch (error) {
    console.error("Erro ao buscar a lista do usuário:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
});

app.delete("/minha-lista/:conteudoId", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { conteudoId } = req.params;
    const usuario = await Usuario.findByPk(usuarioId);
    const conteudo = await Conteudo.findByPk(conteudoId);
    if (!usuario || !conteudo) {
      return res
        .status(404)
        .json({ mensagem: "Usuário ou conteúdo não encontrado." });
    }
    await usuario.removeConteudo(conteudo);
    res
      .status(200)
      .json({
        mensagem: `'${conteudo.titulo}' removido da sua lista com sucesso.`,
      });
  } catch (error) {
    console.error("Erro ao remover conteúdo da lista:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
});

app.get("/perfil", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await Usuario.findByPk(usuarioId, {
      attributes: ["id", "nome", "email", "createdAt"],
    });
    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
});

app.post("/admin/executar-verificacao", authMiddleware, (req, res) => {
  const usuarioId = req.usuario.id;
  console.log(
    `Recebida requisição para executar verificação focada para o usuário ID: ${usuarioId}`
  );
  const comando = `node scripts/verificarLancamentos.js ${usuarioId}`;
  exec(comando, (error, stdout, stderr) => {
    if (error) {
      return res
        .status(500)
        .json({
          mensagem: "Erro ao executar o script.",
          detalhes: error.message,
        });
    }
    if (stderr) {
      return res
        .status(500)
        .json({
          mensagem: "O script de verificação encontrou um erro.",
          detalhes: stderr,
        });
    }
    res
      .status(200)
      .json({ mensagem: "Script executado com sucesso!", output: stdout });
  });
});

app.post(
  "/admin/resetar-notificacao/:conteudoId",
  authMiddleware,
  async (req, res) => {
    try {
      const { conteudoId } = req.params;
      const conteudo = await Conteudo.findByPk(conteudoId);
      if (!conteudo) {
        return res.status(404).json({ mensagem: "Conteúdo não encontrado." });
      }
      await conteudo.update({ data_ultimo_ep: null, notifição_enviada: false });
      res
        .status(200)
        .json({
          mensagem: `Status de notificação para "${conteudo.titulo}" foi resetado com sucesso!`,
        });
    } catch (error) {
      console.error("Erro ao resetar notificação:", error);
      res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
    }
  }
);

// --- INICIALIZAÇÃO DO SERVIDOR ---
async function iniciar() {
  try {
    await testarConexao();
    await sequelize.sync({ alter: true });
    console.log("Todos os modelos foram sincronizados com sucesso.");
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
  }
}

// ✅ A "ignição" que inicia o servidor.
iniciar();
