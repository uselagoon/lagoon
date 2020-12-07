![The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut](/images/lagoon-logo.png)
<br />

# Lagoon - Docker Build and Deploy System for OpenShift & Kubernetes

Lagoon solves what developers are dreaming about: A system that allows developers to locally develop their code and their services with Docker and run the exact same system in production. The same Docker images, the same service configurations and the same code.

!!!warning
    **Note:** This documentation relates to the 1.x releases of Lagoon, built from the `master` branch, and is only maintained as required.
    For the maintained documentation, please visit https://docs.lagoon.sh


## Who are you?

In order to get you started at the right spot, follow one of the links below:

- If you want to use Lagoon to host your Website or Application, visit [Using Lagoon](using_lagoon/index.md)
- If you want to develop Lagoon (i.e. add features), [Developing Lagoon](developing_lagoon/index.md)

## TL;DR: How Lagoon Works
1. Developers define and configure their needed services (like Nginx, PHP, MySQL) within YAML files (like docker-compose.yml) and then test them with docker-compose itself.
2. When they are happy, they push the code to Git.
3. Lagoon parses the YAML files, builds the needed Docker images, creates the needed resources in OpenShift, pushes them to a Docker registry and monitors the deployment of the containers.
4. When all is done, Lagoon informs the developers via different ways (Slack, e-mail, website, etc.).

## Help?

Questions? Ideas? Meet the maintainers and contributors: `#lagoon` in amazee.io RocketChat [https://amazeeio.rocket.chat](https://amazeeio.rocket.chat)

## A couple of things about Lagoon
1. **Lagoon is based on microservices.** A whole deployment and build workflow is very complex; not only do we have multiple sources (like Github, Bitbucket, Gitlab, etc.), multiple OpenShift servers and multiple notification systems (Slack, Rocketchat, etc.), but each deployment is unique and can take from seconds to hours. So it's built with flexibility and robustness in mind. Having microservices that all communicate through a messaging system (RabbitMQ) allows us to scale individual services up and down, survive down times of individual services and also to try out new parts of Lagoon in production without affecting others.
2. **Lagoon uses multiple programming languages.** Each programming language has specific strengths and we try to decide which language makes the most sense for each service. Currently, a lot is built in Node.js, partly because we started with it but also because Node.js allows asynchronous processing of webhooks, tasks and more. We are likely going to change the programming language of some services, but this is what is great about micro services. We can replace a single service with another language without worrying about other parts of the platform.
3. **Lagoon is not Drupal specific**. Everything has been built so that technically it can run any Docker image. There are existing Docker images specifically for Drupal and support for specific Drupal tools like Drush. But that's it.
4. **Lagoon is DevOps.** It allows developers to define the services they need and customize them like they need. You might think this is not the right way to do it and gives too much power to developers. We believe though that as system engineers we need to empower developers and if we allow them not only to define the services locally but also to run and test them locally, they will find bugs and mistakes themselves.
5. **Lagoon runs on Docker and OpenShift.** (That one should be obvious, right?)
6. **Lagoon can be completely developed and tested locally.**
7. **Lagoon is completely integration tested** which means we can test the whole process from receiving Git webhooks until a Docker container with the same Git hash is deployed in OpenShift.
8. **Lagoon is built and deployed via Lagoon.** (Mind blown? ;) )
9. **Most important: It's a work in progress.** It's not fully done yet. At amazee.io we believe that as a hosting community, we need to work together and share code where we can.

In order to understand the Lagoon infrastructure and how the services work together, here is a schema: [https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac](https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac)

## History of Lagoon
As described, Lagoon is a dream come true. At amazee.io we've been hosting Drupal for more than 8 years and this is the fourth major iteration of our hosting platform. The third iteration was built around Puppet and Ansible, where every single piece of the platform was done with configuration management. This allowed very fast setup of new servers, but at the same time was also lacking customizability for developers. We implemented some customizability (some already with Docker in production), but we've never been completely happy with it. With the rise of decoupled Drupal and the need to run Node.js on the server side, plus the requests for Elasticsearch or different Solr versions, we realized that our existing platform wasn't enough.

At the same time, we've been using Docker for multiple years for local development and it was always an idea to use Docker for everything in production.
The only problem was the connection between local development and production environments. There are other systems that allow you to run Drupal in Docker in production but nothing allowed you to test the exact same images and services locally and in production.

Lagoon was born and has been developed since 2017 into a system that runs Docker in production and will replace our third generation hosting platform with a cutting edge all Docker based system.

At amazee.io we also believe in open source, and it was always troubling for us why open source code like Drupal is hosted with proprietary hosting platforms. We believe the strength and success of a hosting company are not the deployment systems or service configurations, but rather the people and their knowledge that run the platform, their processes and skills to react quickly to unforeseen situations and last but not least, the support they provide their clients.
