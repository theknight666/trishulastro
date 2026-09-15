let app;
let initError = null;

try {
  app = require('../server');
} catch (err) {
  initError = {
    message: err.message,
    stack: err.stack
  };
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Vercel Serverless Function Init Error',
      details: initError
    });
  }
  return app(req, res);
};
