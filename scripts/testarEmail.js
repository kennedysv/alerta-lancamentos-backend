const { enviarEmailNotificacao } = require("../services/emailService");

async function teste() {
  console.log("--- Iniciando teste de envio de e-mail ---");

  // Dados de exemplo
  const emailDestinatario = "exemplo.usuario@teste.com"; // Pode ser qualquer email, já que o Ethereal vai capturar
  const nomeSerie = "A Casa do Dragão";
  const dadosEpisodio = {
    name: "O Príncipe Desonesto",
    season_number: 1,
    episode_number: 2,
    air_date: "2022-08-28",
  };

  await enviarEmailNotificacao(emailDestinatario, nomeSerie, dadosEpisodio);

  console.log("--- Teste de envio de e-mail finalizado ---");
}

teste();
