const { sequelize, Conteudo, Usuario } = require("../models");
const { buscarDetalhesPorId } = require("../services/tmdbService");
const { enviarEmailNotificacao, enviarEmailNotificacaoFilme } =
  require("../services/emailService").default;

const usuarioIdAlvo = process.argv[2];

async function verificarNovosLancamentos() {
  if (usuarioIdAlvo) {
    console.log(
      `--- Iniciando verificação focada para o USUÁRIO ID: ${usuarioIdAlvo} ---`
    );
  } else {
    console.log("--- Iniciando verificação GLOBAL (todos os usuários) ---");
  }

  try {
    const filtroUsuario = {};
    if (usuarioIdAlvo) {
      filtroUsuario.id = usuarioIdAlvo;
    }

    const conteudosParaVerificar = await Conteudo.findAll({
      include: [
        {
          model: Usuario,
          where: filtroUsuario,
          required: true,
        },
      ],
    });

    if (conteudosParaVerificar.length === 0) {
      console.log("Nenhum conteúdo sendo seguido para este(s) usuário(s).");
      return;
    }

    console.log(`Verificando ${conteudosParaVerificar.length} conteúdo(s)...`);

    for (const conteudo of conteudosParaVerificar) {
      console.log(
        `\nVerificando "${conteudo.titulo}" (Tipo: ${conteudo.tipo})...`
      );
      const detalhesApi = await buscarDetalhesPorId(
        conteudo.tmdb_id,
        conteudo.tipo
      );

      // Lógica para SÉRIES
      if (conteudo.tipo === "tv" && detalhesApi.last_episode_to_air) {
        const ultimoEpApi = detalhesApi.last_episode_to_air;
        const dataUltimoEpApi = new Date(ultimoEpApi.air_date);
        const dataUltimoEpDb = conteudo.data_ultimo_ep
          ? new Date(conteudo.data_ultimo_ep)
          : null;

        if (!dataUltimoEpDb || dataUltimoEpApi > dataUltimoEpDb) {
          console.log(
            `  -> NOVO EPISÓDIO ENCONTRADO PARA "${conteudo.titulo}"!`
          );
          for (const seguidor of conteudo.Usuarios) {
            await enviarEmailNotificacao(
              seguidor.email,
              conteudo.titulo,
              ultimoEpApi
            );
          }
          await conteudo.update({ data_ultimo_ep: ultimoEpApi.air_date });
        } else {
          console.log("  -> Nenhuma novidade encontrada.");
        }
      }
      // Lógica para FILMES
      else if (conteudo.tipo === "movie") {
        const dataLancamento = new Date(detalhesApi.release_date);
        const hoje = new Date();

        if (dataLancamento <= hoje && !conteudo.notificacao_enviada) {
          console.log(`  -> FILME LANÇADO ENCONTRADO: "${conteudo.titulo}"!`);
          for (const seguidor of conteudo.Usuarios) {
            await enviarEmailNotificacaoFilme(
              seguidor.email,
              conteudo.titulo,
              detalhesApi
            );
          }
          await conteudo.update({ notifição_enviada: true });
          console.log(
            `     -> Notificação para "${conteudo.titulo}" marcada como enviada.`
          );
        } else {
          console.log(
            "  -> Filme ainda não lançado ou notificação já enviada."
          );
        }
      }
    }
  } catch (error) {
    console.error("Ocorreu um erro durante a verificação:", error);
  } finally {
    await sequelize.close();
    console.log("\n--- Verificação concluída. ---");
  }
}

verificarNovosLancamentos();
