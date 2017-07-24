# jobwatch

The purpose of `jobwatch` is to receive status updates from jenkins jobs,
and when the build is complete post the job output to the deploy log S3 bucket.
While this is something that _could_ be added to the jenkins job, there are two reasons for not doing so.  

1. customers do not have access to jenkins, and therefore cannot check themselves
1. jobs may die and we would still need to upload either a partial log or placeholder.


## design

At points throughout the build and deploy process, jenkins posts the status of the job to `jobwatch`. At a set interval, `jobwatch` wakes and asks each job its status.

## potential improvements

1. the "is job dead" detection could be smarter.
1. the job status structure could be persistent, perhaps a queue.
1. the build log could be filtered for secrets, or filtered for excessively
   chatty docker output
1. utilitze `estimatedDuration` for some meaningful information to the user / slack.
