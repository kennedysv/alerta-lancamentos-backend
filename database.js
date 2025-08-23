const { Sequelize } = require("sequelize");

// ✅ ADICIONE ESTAS LINHAS COM AS SUAS CREDENCIAIS
const dbName = "alerta_lancamentos";
const dbUser = "admin";
const dbPassword = "minhasenhasupersecreta";
const dbHost = "localhost";

// Agora as variáveis existem e podem ser usadas aqui
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "postgres",
  logging: false, // Recomendo adicionar para não poluir o console com logs do SQL
});

// Função para testar a conexão
async function testarConexao() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error);
  }
}

module.exports = { sequelize, testarConexao };
