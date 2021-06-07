process.on('loaded', () => {
  global.process = {
    env: process.env,
  };
});
