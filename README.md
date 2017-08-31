# amazee.io Lagoon - Docker Build and Deploy System for OpenShift & Kubernetes

Lagoon solves what Developers are dreaming about: A system that allows Developers to locally develop their code and their services with Docker and run the exact same system in Production. The same Docker Images, the same service configurations, the same code.

#### Here is how it works:
1. Developers define and configure their needed services (like Nginx, PHP, MySQL) within YAML files (like docker-compose.yml), test them with docker-compose itself.
2. When they are happy, they push the code to Git.
3. Lagoon parses the YAML files, builds the needed Docker Images, creates the needed resources in OpenShift, pushes them to a Docker registry and monitors the deployment of the containers.
4. When all is done, Lagoon informs the Developers via different ways (Slack, E-Mail, Website, etc.) about this.

#### A couple of things about Lagoon:
1. Lagoon is based on Microservices. A whole deployment and build workflow is very complex; not only do we have multiple sources (like Github, Bitbucket, Gitlab, etc.), multiple OpenShift servers and multiple notification systems (Slack, Rocketchat, etc.); but each deployment is unique and can take from seconds got maybe even hours. So it's built with flexibility and robustness in mind. Having microservices that all communicate through a messaging system (RabbitMQ) allows us to scale individual services up and down, survive down times of individual services and also to try out new parts of Lagoon in production without affecting others.
2. Lagoon uses multiple programming languages. Each programming language has specific strengths and we try to decide which language makes the most sense for each service. Currently, a lot is built in Node.js, partly because we started with it but also because Node.js allows asynchronous processing of webhooks, tasks and more. We probably gonna change the programming language of some services. But this is what is great about micro services, we can replace a single service with another language without to worry about other parts of the platform.
3. Lagoon is not Drupal specific. Everything has been built that technically it can run any Docker Image. There are Docker Images specifically for Drupal existing and support for specific Drupal tools like Drush. But that's it.
4. Lagoon is DevOps. It allows Developers to define the services they need and customize them like they need. You might think this is not the right way to do it and gives too much power to Developers. We believe though that as System Engineers we need to empower Developers and if we allow them not only to define the services locally but also to run and test them locally, they will find bugs and mistakes themselves.
5. Lagoon runs in Docker and OpenShift. (That one should be obvious?)
6. Lagoon can be completely developed and tested locally.
7. Lagoon is complete integration tested. Which means we can test the whole process from receiving Git Webhooks until a Docker Container with the same Git hash is deployed in OpenShift.
8. Lagoon is built and deployed via Lagoon. (Mind blown? ;) )
9. Most important: It's work in progress, it's not fully done yet. At amazee.io we believe that as a Hosting community we need to work together and share code where we can.

In order to understand the Lagoon infrastructure and how the services work together, here a schema: [https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac](https://www.lucidchart.com/documents/view/a3cf0c4f-1bc1-438f-977d-4b26f235ceac)

#### History of Lagoon
As described, Lagoon is a dream come true. At amazee.io we're hosting Drupal since more than 8 years and this is the fourth major iteration of our hosting platform. The 3rd iteration was built around Puppet and Ansible, where every single piece of the platform was done with configuration management. This allowed very fast setup of new servers, but at the same time was also lacking customizability for developers. We implemented some customizability (some already with Docker in Production), but we've never been completely happy with it. With the rise of Decoupled Drupal and the need to run Node.js on the server side, plus the requests for Elasticsearch or different Solr versions we realized that our existing platform wasn't enough.

At the same time, we've been using Docker already for multiple years for local development and it was always an idea to use Docker for everything in Production.
The only problem was the connection between local development and production environments. There are other systems that allow you to run Drupal in Docker in Production. But nothing allowed you to test the exact same Images and services locally and in production.

Lagoon was born and has been developed since 2017 into a system that runs Docker in Production and will replace our 3rd generation Hosting Platform with a cutting edge all Docker based system.

At amazee.io we also believe in Open Source, and it was always troubling for us why Open Source Code like Drupal is hosted with proprietary hosting platforms. We believe the strength and success of a Hosting company are not the deployment systems or service configurations, but rather the people and their knowledge that run the platform, their processes and skills to react quickly to unforeseen situations and last but not least the support they provide their clients.
