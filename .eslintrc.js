module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: "2018",
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'nestjs'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    "plugin:jest/recommended",
    "prettier",
    'plugin:nestjs/recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    commonjs: true,
    es6: true,
  },
  ignorePatterns: ['.eslintrc.js', "node_modules", "dist"],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-unused-vars": 'off',
    'jest/expect-expect': 'off',
    "@typescript-eslint/no-namespace": "off",
    "nestjs/use-validation-pipe": "off"
  },
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "src"]
      }
    }
  }
};
