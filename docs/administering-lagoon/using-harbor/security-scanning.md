# Security Scanning

Harbor comes with a built-in security scanning solution provided by the Trivy service. This service analyzes a specified container image for any installed packages, and collects the version numbers of those installed packages. The Trivy service then searches the [National Vulnerability Database](https://nvd.nist.gov/) for any CVEs \(common vulnerabilities and exposures\) affecting those package versions. Trivy is also library aware, so it will scan any Composer files or other package library definition files and report any vulnerabilities found within those package versions. These vulnerabilities are then reported within Harbor for each individual container.

An example of a security scan in Harbor, showing applicable vulnerabilities for a scanned container:

![Harbor Security Scanning Example Image](scanning_image_1.png)
