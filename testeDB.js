// Importamos apenas o sequelize, que cuida da conexão.
const { sequelize } = require("./models");

async function executarTesteDeConexao() {
  console.log("--- Iniciando teste de conexão direta com o banco de dados ---");
  try {
    console.log("1. Tentando autenticar a conexão...");
    // O método authenticate() apenas testa se a conexão é válida.
    await sequelize.authenticate();
    console.log("2. ✅ Autenticação bem-sucedida!");

    console.log("3. Executando uma query simples (SELECT 1+1)...");
    // Executamos um comando SQL simples para ver se o banco responde.
    const [resultados] = await sequelize.query("SELECT 1+1 AS resultado");
    console.log("4. ✅ Query executada com sucesso!");
    console.log("5. Resultado do banco:", resultados[0]); // Deve mostrar { resultado: 2 }
  } catch (error) {
    console.error("❌ ERRO DURANTE O TESTE DE BANCO DE DADOS:", error);
  } finally {
    // É crucial fechar a conexão para que o script possa terminar.
    await sequelize.close();
    console.log("--- Teste finalizado. Conexão com o banco fechada. ---");
  }
}

executarTesteDeConexao();
