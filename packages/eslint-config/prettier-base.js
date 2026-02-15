/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  // Максимальная длина строки перед переносом
  // По умолчанию: 80
  printWidth: 90,

  // Количество пробелов на один уровень отступа
  // По умолчанию: 2
  tabWidth: 2,

  // Использовать табы вместо пробелов для отступов
  // По умолчанию: false
  useTabs: true,

  // Добавлять точку с запятой в конце выражений
  // По умолчанию: true
  semi: false,

  // Использовать одинарные кавычки вместо двойных
  // По умолчанию: false
  singleQuote: true,

  // Использовать одинарные кавычки в JSX атрибутах
  // По умолчанию: false
  jsxSingleQuote: true,

  // Добавлять завершающие запятые везде, где это возможно
  // Варианты: "none" | "es5" | "all"
  // По умолчанию: "all"
  trailingComma: 'all',

  // Тип переноса строки (должен совпадать с .editorconfig)
  // Варианты: "lf" | "crlf" | "cr" | "auto"
  // По умолчанию: "lf"
  endOfLine: 'lf',
};

export default config;
