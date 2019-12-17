module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  testPathIgnorePatterns: ["/node_modules/", "/dist"],
  globals: {
    "ts-jest": {
      diagnostics: {
        warnOnly: true,
      }
    }
  }
};