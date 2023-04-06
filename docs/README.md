# Lagoon

![](./lagoon-logo.png)

## Lagoon - the Open Source Application Delivery Platform for Kubernetes

Lagoon gives developers what they dream about. It's a system that allows developers to run the exact same code in their local and production environment. The same Docker images, the same service configurations, and the same code.

## Who are you?

<div class="grid cards" markdown>

- If you want to use Lagoon to host your website or application, visit [Using Lagoon](using-lagoon-the-basics/index.md).
- If you want to develop Lagoon \(add features, fix bugs\), [Developing Lagoon](contributing-to-lagoon/developing-lagoon.md).

</div>
## TL;DR: How Lagoon Works

1. Developers define and configure needed services within YAML files.
2. When they are happy, they push the code to Git.
3. Lagoon parses the YAML files and adds in any additional needed configuration.
4. Lagoon builds the needed Docker images.
5. Lagoon pushes them to a Docker registry.
6. Lagoon creates the needed resources in Kubernetes.
7. Lagoon monitors the deployment of the containers.
8. When all is done, Lagoon informs the developers in different ways \(Slack, email, website, etc\).

## Help?

Questions? Ideas? Meet the maintainers and contributors.

Chat with us on the Lagoon Discord: [https://discord.gg/te5hHe95JE
](https://discord.gg/te5hHe95JE
)

## A couple of things about Lagoon

1. **Lagoon is based on microservices**. The deployment and build workflow is very complex. We have multiple version control sources, multiple clusters, and multiple notification systems. Each deployment is unique and can take from seconds to hours. It's built with flexibility and robustness in mind. Microservices communicate through a messaging system, which allows us to scale individual services up and down. It allows us to survive down times of individual services. It also allows us to try out new parts of Lagoon in production without affecting others.
2. **Lagoon uses many programming languages**. Each programming language has specific strengths. We try to decide which language makes the most sense for each service. Currently, a lot of Lagoon is built in Node.js. This is partly because we started with Node.js, but also because Node.js allows asynchronous processing of webhooks, tasks and more. We are likely going to change the programming language of some services. This is what is great about microservices! We can replace a single service with another language without worrying about other parts of the platform.
3. **Lagoon is not Drupal-specific**. Everything has been built so that it can run any Docker image. There are existing Docker images for Drupal, and support for Drupal-specific tools like Drush. But that's it!
4. **Lagoon is DevOps**. It allows developers to define the services they need and customize them as they need. You might think this is not the right way to do it, and gives too much power to developers. We believe that as system engineers, we need to empower developers. If we allow developers to define services locally, and test them locally, they will find bugs and mistakes themselves.
5. **Lagoon runs on Docker and Kubernetes.** \(That one should be obvious, right?\)
6. **Lagoon can be completely locally developed and tested.**
7. **Lagoon is completely integration tested**. This means we can test the whole process. From receiving Git webhooks to deploying into a Docker container, the same Git hash is deployed in the cluster.
8. **Most important: It's a work in progress**. It's not done yet. At amazee.io, we believe that as a hosting community, we need to work together and share code where we can.

We want you to understand the Lagoon infrastructure and how the services work together. Here is a schema \(it's a little out of date - it doesn't include some of the more recent services we've added, or cover Kubernetes, so we're working on an update!\): [https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac](https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac) ‌

## History of Lagoon

As described, Lagoon is a dream come true. At amazee.io, we've been hosting Drupal for more than 8 years. This is the fourth major iteration of our hosting platform. The third iteration was built around Puppet and Ansible. Every single piece of the platform was done with configuration management. This allowed very fast setup of new servers, but at the same time was also lacking customizability for developers. We implemented some customizability, with some already with Docker in production. However, we were never completely happy with it. We realized that our existing platform wasn't enough. With the rise of decoupled Drupal, the need to run Node.js on the server side, the requests for Elasticsearch, and different Solr versions, we had to do more. ‌

At the same time, we've been using Docker for many years for local development. It was always an idea to use Docker for everything in production. The only problem was the connection between local development and production environments. There are other systems that allow you to run Drupal in Docker in production. But, nothing allowed you to test the exact same images and services locally and in production.

Lagoon was born in 2017. It has since been developed into a system that runs Docker in production. Lagoon has replaced our third generation hosting platform with a cutting edge all Docker-based system.

### Open Source

At amazee.io, we believe in open source. It was always troubling for us that open source code like Drupal was hosted on proprietary hosting platforms. The strength and success of a hosting company is not just their deployment systems or service configurations. It's the the people and knowledge that run the platform. The processes, skills, ability to react to unforeseen situations, and last but not least, the support they provide their clients.

### License

Lagoon is available under [`an Apache 2.0 License`](https://github.com/uselagoon/lagoon/blob/main/LICENSE).

