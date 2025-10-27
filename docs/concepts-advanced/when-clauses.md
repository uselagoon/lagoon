# When Clauses

When clauses allow for the conditional running of tasks in `.lagoon.yml`. They provide a powerful way to control when pre-rollout and post-rollout tasks execute based on environment variables, branch names, and other conditions.

## Overview

The `when` clause expects an expression that evaluates to a true/false value, determining whether the task should run. When clauses are based on the [gval expression language](https://github.com/PaesslerAG/gval) with additional Lagoon-specific extensions.

This enables you to:

- Run tasks only on specific branches
- Skip tasks in production environments
- Execute tasks based on custom environment variables
- Create complex conditional logic for deployments

## Operators

The following comparison operators are available for use in `when` clauses:

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal to | `LAGOON_GIT_BRANCH == "main"` |
| `!=` | Not equal to | `LAGOON_GIT_BRANCH != "production"` |
| `=~` | Matches regex pattern | `LAGOON_GIT_BRANCH =~ "^feature/.*"` |
| `!~` | Does not match regex pattern | `LAGOON_GIT_BRANCH !~ "^hotfix/.*"` |

## Functions

The following functions are available for handling variables safely:

| Function | Description | Example |
|----------|-------------|---------|
| `withDefault(variable, default)` | Returns the variable value if it exists, otherwise returns the default value | `withDefault("NONEXISTENT_VAR", false) == true` |
| `exists(variable)` | Returns true if the variable exists, false otherwise | `exists("LAGOON_GIT_BRANCH")` |

### Using Functions Safely

The `withDefault()` and `exists()` functions are particularly useful for preventing errors when referencing variables that may not exist in all environments:

- Use `exists()` to check if a variable is defined before using it
- Use `withDefault()` to provide fallback values for undefined variables
- These functions prevent panics that can occur when referencing undefined variables

## Usage Examples

### Basic Comparisons

```yaml title=".lagoon.yml"
tasks:
  post-rollout:
    - run:
        name: Run on main branch only
        command: drush cim
        service: cli
        when: LAGOON_GIT_BRANCH == "main"
    - run:
        name: Skip on production
        command: drush sql-sync @prod @self
        service: cli
        when: LAGOON_ENVIRONMENT_TYPE != "production"
```

### Regex Pattern Matching

```yaml title=".lagoon.yml"
tasks:
  post-rollout:
    - run:
        name: Run on feature branches
        command: ./scripts/feature-setup.sh
        service: cli
        when: LAGOON_GIT_BRANCH =~ "^feature/.*"
    - run:
        name: Skip hotfix branches
        command: ./scripts/standard-deploy.sh
        service: cli
        when: LAGOON_GIT_BRANCH !~ "^hotfix/.*"
```

### Variable Existence and Defaults

```yaml title=".lagoon.yml"
tasks:
  post-rollout:
    - run:
        name: Run only if custom variable exists
        command: ./scripts/custom-setup.sh
        service: cli
        when: exists("CUSTOM_DEPLOY_FLAG")
    - run:
        name: Use default value for undefined variable
        command: echo "Debug mode enabled"
        service: cli
        when: withDefault("DEBUG_MODE", false) == true
```

### Complex Conditions

```yaml title=".lagoon.yml"
tasks:
  post-rollout:
    - run:
        name: Complex condition with default
        command: ./scripts/conditional-task.sh
        service: cli
        when: withDefault("FEATURE_ENABLED", "false") == "true" && LAGOON_GIT_BRANCH == "main"
    - run:
        name: Multiple conditions
        command: ./scripts/staging-sync.sh
        service: cli
        when: LAGOON_ENVIRONMENT_TYPE == "development" && exists("SYNC_FROM_PROD")
```

## Available Variables

You can reference any of the following in `when` clauses:

- Default Lagoon environment variables (such as `LAGOON_GIT_BRANCH`, `LAGOON_ENVIRONMENT_TYPE`, etc.)
- Any `BUILD` or `GLOBAL` scoped variables defined in the Lagoon API

## Integration with Tasks

When clauses can be used with both pre-rollout and post-rollout tasks. They are evaluated at runtime, so they have access to all environment variables available during the deployment process.

For more information about tasks in general, see the [tasks documentation](../concepts-basics/lagoon-yml.md#tasks).