// flow-typed signature: f39e87ae093403a8f3c789273ccddbf6
// flow-typed version: 7e7c66e29a/body-parser_v1.x.x/flow_>=v0.30.x

declare type bodyParser$Options = {
  inflate?: boolean;
  limit?: number | string;
  type?: string | string[] | ((req: express$Request) => any);
  verify?: (req: express$Request, res: express$Response, buf: Buffer, encoding: string) => void;
};

declare type bodyParser$OptionsText = bodyParser$Options & {
  reviever?: (key: string, value: any) => any;
  strict?: boolean;
};

declare type bodyParser$OptionsJson = bodyParser$Options & {
  reviever?: (key: string, value: any) => any;
  strict?: boolean;
};

declare type bodyParser$OptionsUrlencoded = bodyParser$Options & {
  extended?: boolean;
  parameterLimit?: number;
};

declare module "body-parser" {

    declare type Options = bodyParser$Options;
    declare type OptionsText = bodyParser$OptionsText;
    declare type OptionsJson = bodyParser$OptionsJson;
    declare type OptionsUrlencoded = bodyParser$OptionsUrlencoded;

    declare function json(options?: OptionsJson): express$Middleware;

    declare function raw(options?: Options): express$Middleware;

    declare function text(options?: OptionsText): express$Middleware;

    declare function urlencoded(options?: OptionsUrlencoded): express$Middleware;

}
