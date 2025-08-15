import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/next_auth_project');

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});