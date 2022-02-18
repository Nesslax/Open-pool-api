const express = require('express')
const app = express()
//const {setupLogging} = require("./logging");
const port = 3030


const nanopoolRoutes = require("./pools/nanopool/routes.js");
const 2minersRoutes = require("./pools/2miners/routes.js");
const hiveonRoutes = require("./pools/hiveon/routes.js");


//setupLogging(app);

app.get('/ping', (req, res) => {
  res.send('Hello World!')
})

app.use("/nanopool", nanopoolRoutes);
app.use("/2miners", 2minersRoutes);
app.use("/hiveon", hiveonRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
