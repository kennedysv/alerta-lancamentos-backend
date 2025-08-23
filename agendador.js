const cron = require("node-cron");
const { exec } = require("child_process"); // Módulo nativo do Node.js para executar comandos do sistema

console.log("Agendador de tarefas iniciado.");
console.log(
  "A verificação de lançamentos será executada a cada 2 minutos para fins de teste."
);

cron.schedule("0 9 * * *", () => {
  // Esta função será executada a cada 2 minutos.
  console.log(
    `\n[${new Date().toLocaleString(
      "pt-BR"
    )}] -> Executando a verificação de lançamentos agendada...`
  );

  // 'exec' executa um comando no terminal, como se nós mesmos tivéssemos digitado.
  // É uma forma robusta de rodar nosso script de verificação.
  exec("node scripts/verificarLancamentos.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar o script agendado: ${error.message}`);
      return;
    }
    if (stderr) {
      // stderr captura os erros que acontecem DENTRO do script.
      console.error(`O script de verificação reportou um erro:\n${stderr}`);
      return;
    }
    // stdout é a saída de sucesso do script (todos os console.log).
    console.log(
      `--- Início da Saída do Script --- \n${stdout}\n--- Fim da Saída do Script ---`
    );
  });
});
