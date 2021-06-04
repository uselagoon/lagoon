# PHPUnit and PhpStorm

{% hint style="info" %}
**This document assumes the following:** 

* You are using Docker. 
* You are using a standard Amazee/Lagoon project with a [`docker-compose.yml`](../using-lagoon-the-basics/docker-compose-yml.md) file. 
* You are on a Mac - it should work for other operating systems but folder structure and some configuration settings may be different.
{% endhint %}

## Configuring the project

1. Duplicate\* the `/core/phpunit.xml.dist` file to `/core/phpunit.xml`
2. Edit\* `/core/phpunit.xml` and fill in the following variables:

* **SIMPLETEST\_DB**: `mysql://drupal:drupal@mariadb:3306/drupal#db`
* **SIMPLETEST\_BASE\_URL**: `<PROJECT_URL>`

## Configuring PhpStorm

### Set Up Docker

1. In PhpStorm, go to **File &gt; Settings &gt; Build, Execution, Deployment &gt; Docker**
2. Click: `+`
3. Select\*: `Docker for Mac`

![Set Up Docker](../.gitbook/assets/1-docker-setup.png)



### Set Up CLI interpreter

**Add a new CLI interpreter:**

1. In PhpStorm, go to **File &gt; Settings &gt; Languages & Frameworks &gt; PHP**
2. Click `...` and then `+`
3. Next select: Add a new CLI interpreter from Docker, vagrant...
4. Use the following configurations:
   * Server: `<DOCKER>`
   * Configuration file\(s\): `./docker-compose.yml`
   * Service: `cli`
   * Lifecycle: `Connect to existing container ('docker-compose exec')`
5. Path mappings:
   * Local path: `<ROOT_PATH>`
   * Remote path\*: `/app`

![Add a new CLI interpreter:](../.gitbook/assets/2-cli-interpreter.png)



### **Set Up Remote Interpreter**

**Add Remote Interpreter:**

1. In PhpStorm, go to **File &gt; Settings &gt; Languages & Frameworks &gt; PHP &gt; Test Frameworks**
2. Click `+` and select `PHPUnit by Remote Interpreter`
3. Use the following configurations:
   * CLI Interpreter: `<CLI_INTERPRETER>`
   * Path mappings\*: `<PROJECT_ROOT> -> /app`
   * PHPUnit: `Use Composer autoloader`
   * Path to script\*: `/app/vendor/autoload.php`
   * Default configuration file\*: `/app/web/core/phpunit.xml`

![Add Remote Interpreter](../.gitbook/assets/3-remote-interpreter-setup.png)



#### Setup/Configure Runner Template <a id="Drupal:PHPUnitandPhpStorm-Setup/ConfigureRunnerTemplate"></a>

1. **Configure runner:**
   1. In PhpStorm, go to **Run &gt; Edit Configurations... &gt; Templates &gt; PHPUnit**
   2. Use the following configurations:
      * Test scope: `Defined in the configuration file`
      * Interpreter: `<CLI_INTERPRETER>`

![Configure runner](../.gitbook/assets/4-configure-runner.png)

**\***If you are not on a Mac, this may vary.

## Final checks

**Some final checks to run before you run a test!**

1. You have the project up and running:  `$ docker-compose up -d`
2. The project is working without any errors, visit the site just to make sure it all works as expected - this is not 100% necessary, but nice to know it is working normally.
3. We should be ready to run some tests!

## Ready to Run!

Now you have the above configuration set up it should be as straightforward as going to the test you want to run and pressing the green arrow! 

Once you press this PhpStorm will use docker to enter the cli container than start running PHPUnit based upon the config, exciting right?

![Here it is in action, look at it go!!](../.gitbook/assets/5-going-green-1-.gif)

