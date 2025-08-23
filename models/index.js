const { sequelize, testarConexao } = require("../database");

// ✅ Verifique estas duas linhas com MUITA atenção
const Conteudo = require("./conteudo");
const Usuario = require("./usuario");

// --- Definir as Relações ---
Usuario.belongsToMany(Conteudo, { through: "ListaDeSeguidores" });
Conteudo.belongsToMany(Usuario, { through: "ListaDeSeguidores" });

// Exportar tudo que for necessário
module.exports = {
  sequelize,
  testarConexao,
  Conteudo,
  Usuario,
};
