// @flow

import { blue } from 'chalk';
import R from 'ramda';

import type Inquirer from 'inquirer';

function notifyOptionUsed(
  clog: typeof console.log,
  option: string,
  val: any,
): void {
  clog(
    `${blue('!')} Set "${option}" option to "${val}" from arguments or config`,
  );
}

// Return a [predicate, transformer] pair for use with R.cond(). The predicate and transformer functions expect an object with an "options" property containing the options to use.
export function answerWithOptionIfSet(
  option: string,
  answers: Inquirer.answers,
  clog: typeof console.log,
) {
  return [
    (R.compose(
      // Option is set
      R.has(option),
      R.prop('options'),
    ): ({ options: Object }) => boolean),
    (objectWithOptions: { options: Object }): void => {
      // Assign option key in the answers object to option value and let the user know
      const propVal = R.path(['options', option], objectWithOptions);
      notifyOptionUsed(clog, option, propVal);
      answers[option] = propVal;
    },
  ];
}

// Return a function to use with the `when` option of the question object.
// https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
export function answerWithOptionIfSetOrPrompt(
  option: string,
  options: Object,
  clog: typeof console.log,
) {
  return (answers: Inquirer.answers) => R.ifElse(
    // If the option exists, use it and let the user know...
    ...answerWithOptionIfSet(option, answers, clog),
    // ...otherwise return true to prompt the user to manually enter the option
    R.T,
  )({ options });
}
