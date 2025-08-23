const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Usuario = sequelize.define(
  "Usuario",
  {
    // ✅ GARANTA QUE ESTE CAMPO ESTÁ EXATAMENTE ASSIM: "nome"
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "usuarios",
  }
);

module.exports = Usuario;
