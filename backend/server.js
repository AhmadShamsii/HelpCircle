require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/next_auth_project');

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
