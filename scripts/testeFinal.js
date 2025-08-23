console.log("--- EXECUTANDO O TESTE DE ISOLAMENTO ---");

// Importa os modelos e a conexão do seu arquivo index, que já sabemos que está correto.
const { Conteudo, Usuario, sequelize } = require("../models");

async function executarQuery() {
  try {
    console.log("Tentando executar a query em 'Conteudo.findAll()'...");

    // Esta é a única operação que faremos.
    const resultado = await Conteudo.findAll({
      include: [{ model: Usuario, required: true }],
    });

    console.log("✅ SUCESSO! A query foi executada sem erros.");
    console.log(`Encontrados ${resultado.length} conteúdos sendo seguidos.`);
  } catch (error) {
    console.error("❌ ERRO! A query falhou. Erro detalhado abaixo:");
    console.error(error);
  } finally {
    // Garante que a conexão com o banco seja fechada para o script terminar.
    await sequelize.close();
    console.log("--- FIM DO TESTE DE ISOLAMENTO ---");
  }
}

// Executa a função de teste.
executarQuery();
