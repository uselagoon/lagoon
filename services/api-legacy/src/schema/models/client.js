import { readFile } from '../../utility/yamlStorage';

export default class Client {
  constructor(clientName, fullJson) {
    this.id = clientName;
    this.clientName = clientName;
    this.fullJson = fullJson;
    this.deployPrivateKey = fullJson.deploy_private_key;
    this.created = fullJson.created;
    this.comment = fullJson.comment;    
  }
}

export const getAllClients = async () => {
  const fileName = 'amazeeio/clients.yaml';

  const clients = [];
  const yaml = await readFile(fileName);
  if (yaml.hasOwnProperty('amazeeio_clients')) {
    Object.keys(yaml.amazeeio_clients).forEach((clientName) => {
      if (yaml.amazeeio_clients.hasOwnProperty(clientName)) {
        clients.push(new Client(clientName, yaml.amazeeio_clients[clientName]));
      }
    });
  }

  return clients;
};

export const getClientById = async (id) =>
  (await getAllClients()).find((client) => client.id === id);
