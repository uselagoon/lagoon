// @flow

import express from "express";
import graphQL from "express-graphql";
import schema from "../schema";
import statusController from "./status";
import keysController, { keysAccessMiddleware } from "./keys";

const selectors = require("../selectors");

import type { Action } from "../actions";
import type { $Request, $Response } from "express";
import type { ApiStore } from "../createStore";

export type Context = {
  selectors: typeof selectors,
  dispatch(action: Action): void
};

export default function createRouter(store: ApiStore): express$Router {
  const router = new express.Router();
  const context = {
    selectors,
    dispatch: store.dispatch,
    getState: store.getState
  };

  // Add the GraphQL server.
  router.use(
    "/graphql",
    graphQL({
      graphiql: process.env.NODE_ENV === "development",
      pretty: true,
      schema,
      context
    })
  );

  // Redirect GET requests on "/" to the status route.
  router.get("/", (req: $Request, res: $Response) => res.redirect("/status"));
  router.get("/status", statusController);

  // Return keys of all clients from clients.yaml.
  router.get("/keys", keysAccessMiddleware, keysController);

  return router;
}

