const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Conteudo = sequelize.define(
  "Conteudo",
  {
    tmdb_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // unique: true, // <-- REMOVA ESTA LINHA DAQUI
      comment: "O ID único do The Movie Database.",
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "O título do conteúdo.",
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Tipo do conteúdo (ex: 'movie' ou 'tv').",
    },
    data_ultimo_ep: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Data do último episódio/lançamento verificado.",
    },
    notificacao_enviada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment:
        "Controla se a notificação de lançamento (para filmes) já foi enviada.",
    },
  },
  {
    tableName: "Conteudos",
    // ✅ ADICIONE ESTE BLOCO "indexes" NO FINAL
    indexes: [
      {
        unique: true,
        fields: ["tmdb_id"],
      },
    ],
  }
);

module.exports = Conteudo;
