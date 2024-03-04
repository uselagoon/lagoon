import R from 'ramda';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';

const parseJson = bodyParser.json();

declare type keycloakGrant = {
  access_token: string,
}

export const generateRoute = (getUserGrant: (userId: string) => Promise<keycloakGrant>) => {
  const route = async (req: Request, res: Response) => {
    const userId: any = R.path(['body', 'userId'], req);
    const verbose = R.pathOr(false, ['body', 'verbose'], req);
    const returnGrant = R.pathOr(false, ['body', 'grant'], req);

    if (userId == null) {
      return res.status(500).send('Missing parameter "userId"');
    }

    try {
      const grant = await getUserGrant(userId);
      const { access_token: token } = grant;

      const data = {
        payload: {
          userId,
        },
        token,
        grant,
      };

      // Verbose mode will send back all the information
      // which was being used for creating the token
      if (verbose) {
        res.json(data);
      } else {
        res.send(returnGrant ? grant : token);
      }
    } catch (e) {
      res.status(500).send(e.message);
    }
  };

  return [parseJson, route];
};
