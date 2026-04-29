# Project Clone Task Image

This task image is responsible for archiving data from a source environment during the project clone process.

When a project is cloned, this task runs in the source environment:
1. Run `lagoon-sync archive-dump` to create an archive file
2. Upload the archived files to the `ProjectClone`
3. Update the ProjectClone status to `SOURCE_FILES_UPLOADED`

Dependent on lagoon-sync: Used to create the archive dump of the environment data

