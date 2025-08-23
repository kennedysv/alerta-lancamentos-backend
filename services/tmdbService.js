const axios = require("axios");
require("dotenv").config();

const apiKey = process.env.TMDB_API_KEY;
const apiBaseUrl = "https://api.themoviedb.org/3";

/**
 * Busca por conteúdos (filmes e séries) no TMDb.
 * @param {string} query O termo de busca (ex: "Breaking Bad").
 * @returns {Promise<Array>} Uma promessa que resolve para uma lista de resultados.
 */
async function buscarConteudo(query) {
  const searchUrl = `${apiBaseUrl}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&language=pt-BR`;
  try {
    const response = await axios.get(searchUrl);
    return response.data.results;
  } catch (error) {
    console.error("Erro ao buscar dados no TMDb:", error.message);
    throw new Error("Não foi possível buscar os dados no TMDb.");
  }
}

/**
 * Busca os detalhes completos de um filme ou série pelo seu ID no TMDb.
 * @param {number} tmdbId O ID do conteúdo no TMDb.
 * @param {string} tipo O tipo do conteúdo ('tv' para série, 'movie' para filme).
 * @returns {Promise<Object>} Uma promessa que resolve para o objeto de detalhes do conteúdo.
 */
async function buscarDetalhesPorId(tmdbId, tipo) {
  const detailUrl = `${apiBaseUrl}/${tipo}/${tmdbId}?api_key=${apiKey}&language=pt-BR`;
  try {
    const response = await axios.get(detailUrl);
    return response.data;
  } catch (error) {
    console.error(
      `Erro ao buscar detalhes para ${tipo} ID ${tmdbId}:`,
      error.message
    );
    throw new Error("Não foi possível buscar os detalhes no TMDb.");
  }
}

// Exportamos AMBAS as funções para que outros arquivos possam usá-las
module.exports = {
  buscarConteudo,
  buscarDetalhesPorId,
};
