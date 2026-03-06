import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 3500;

// connect database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
