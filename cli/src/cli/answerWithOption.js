// @flow

import { blue } from 'chalk';
import R from 'ramda';

import type { inquirer$Answers } from 'inquirer';

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
export function answerWithOptionIfSet({
  option,
  answers,
  notify,
  clog,
}: {
  option: string,
  answers: inquirer$Answers,
  notify?: boolean,
  clog: typeof console.log,
}) {
  return [
    (R.compose(
      // Option is set
      R.has(option),
      R.prop('options'),
    ): ({ options: Object }) => boolean),
    (objectWithOptions: { options: Object }): false => {
      // Assign option key in the answers object to option value and let the user know
      const propVal = R.path(['options', option], objectWithOptions);
      if (notify === true) {
        notifyOptionUsed(clog, option, propVal);
      }

      // $FlowFixMe Covariant property cannot be assigned
      answers[option] = propVal;
      return false;
    },
  ];
}

// Return a function to use with the `when` option of the question object.
// https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
export function answerWithOptionIfSetOrPrompt({
  option,
  options,
  notify,
  clog,
}: {
  option: string,
  options: Object,
  notify?: boolean,
  clog: typeof console.log,
}): inquirer$Answers => boolean {
  return (answers: inquirer$Answers) =>
    R.ifElse(
      // If the option exists, use it and let the user know...
      ...answerWithOptionIfSet({
        option,
        answers,
        notify,
        clog,
      }),
      // ...otherwise return true to prompt the user to manually enter the option
      R.T,
    )({ options });
}
