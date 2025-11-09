import express, { json } from "express";
import cors from "cors";

const app = express();
const PORT = 6969;

app.use(json());
app.use(cors());

app.post("/notification", (req, res) => {
  const { email, subject, body } = req.body;
  const time = new Date().toISOString();

  const message = `
:: ======================== ::  
:: new contact notification ::
     at: ${time}
   from: ${email}  
subject: ${subject}
message:
---------------------------
${body}
---------------------------
:: ======================== :: 
`;

  // normally we'd do more with this --- maybe sanitize and use an email sender or something.
  console.log(message);
 
  res.json({ status: "ok" });
});

app.get("/", (_, res) =>
  res.send({
    hey: "charlee notification server here!",
    superSecretApiKey: "d34db33f",
  })
);

const server = app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}... close with ctrl-c`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nseeya!");
  });
});
