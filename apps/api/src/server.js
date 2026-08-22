require('dotenv').config();
const app = require('./app'),
  connectDb = require('./config/db');
const port = process.env.PORT || 5000;
connectDb()
  .then(() => app.listen(port, () => console.log(`API ready on :${port}`)))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
