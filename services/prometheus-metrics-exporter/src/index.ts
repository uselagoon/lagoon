import { register } from "prom-client";
import http from "http";
import express from "express";
//create a server object:
http
  .createServer(function(req, res) {
    res.write("Hello World!"); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080

const app = express();

app.get("/prom-test", function(req: express.Request, res: express.Response) {
  res.send(register.metrics());
});