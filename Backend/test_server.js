import app from "./src/app.js";

console.log("App imported successfully.");
const server = app.listen(3501, () => {
  console.log("Server listening on 3501");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
