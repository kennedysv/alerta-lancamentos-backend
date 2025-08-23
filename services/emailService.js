import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Função para RECUPERAÇÃO DE SENHA
async function enviarEmailRecuperacao(destinatario, token) {
  const linkRecuperacao = `http://localhost:5173/redefinir-senha?token=${token}`;
  const msg = {
    to: destinatario,
    from: `"Alerta de Lançamentos" <${process.env.MAIL_USER}>`,
    subject: "Recuperação de Senha - Alerta de Lançamentos",
    html: `<h1>Recuperação de Senha</h1><p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p><a href="${linkRecuperacao}" target="_blank">Redefinir Minha Senha</a><p>Este link expirará em 15 minutos.</p><p>Se você não solicitou isso, por favor, ignore este e-mail.</p>`,
  };
  try {
    await transporter.sendMail(msg);
    console.log(`E-mail de recuperação enviado para ${destinatario}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail de recuperação via Gmail:", error);
    throw new Error("Não foi possível enviar o e-mail de recuperação.");
  }
}

// Função para notificar sobre SÉRIES
async function enviarEmailNotificacao(
  destinatario,
  tituloConteudo,
  detalhesEpisodio
) {
  console.log(`Preparando e-mail de episódio para ${destinatario}...`);
  try {
    await transporter.sendMail({
      from: `"Alerta de Lançamentos" <${process.env.MAIL_USER}>`,
      to: destinatario,
      subject: `🎉 Novo episódio de ${tituloConteudo}!`,
      html: `<h1>Olá!</h1><p>Um novo episódio de <strong>${tituloConteudo}</strong> acaba de ser lançado!</p><h3>Detalhes do Episódio:</h3><ul><li><strong>Título:</strong> ${detalhesEpisodio.name}</li><li><strong>Temporada:</strong> ${detalhesEpisodio.season_number}</li><li><strong>Episódio:</strong> ${detalhesEpisodio.episode_number}</li><li><strong>Data de Lançamento:</strong> ${detalhesEpisodio.air_date}</li></ul><p>Corra para assistir!</p>`,
    });
    console.log(`E-mail de episódio enviado para ${destinatario}!`);
  } catch (error) {
    console.error(
      `Erro ao enviar e-mail de episódio para ${destinatario}:`,
      error
    );
  }
}

// Função para notificar sobre FILMES
async function enviarEmailNotificacaoFilme(
  destinatario,
  tituloConteudo,
  detalhesFilme
) {
  console.log(
    `Preparando e-mail de lançamento de filme para ${destinatario}...`
  );
  try {
    await transporter.sendMail({
      from: `"Alerta de Lançamentos" <${process.env.MAIL_USER}>`,
      to: destinatario,
      subject: `🎬 O filme ${tituloConteudo} já foi lançado!`,
      html: `<h1>Olá!</h1><p>O filme <strong>${tituloConteudo}</strong> que você está seguindo já está disponível!</p><h3>Detalhes do Filme:</h3><ul><li><strong>Título Original:</strong> ${
        detalhesFilme.title
      }</li><li><strong>Data de Lançamento:</strong> ${new Date(
        detalhesFilme.release_date
      ).toLocaleDateString("pt-BR")}</li><li><strong>Sinopse:</strong> "<em>${
        detalhesFilme.overview
      }</em>"</li></ul><p>Corra para assistir!</p>`,
    });
    console.log(`E-mail de filme enviado para ${destinatario}!`);
  } catch (error) {
    console.error(
      `Erro ao enviar e-mail de filme para ${destinatario}:`,
      error
    );
  }
}

// ✅ A LINHA MAIS IMPORTANTE: Garante que TODAS as funções sejam exportadas.
export default {
  enviarEmailRecuperacao,
  enviarEmailNotificacao,
  enviarEmailNotificacaoFilme,
};
