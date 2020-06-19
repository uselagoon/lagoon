// This is needed to avoid stripping important identifiers like `*` from knex queries
// Ref: https://github.com/Vincit/objection.js/blob/89481597099e33d913bd7a7e437ff7a487c62fbd/lib/utils/identifierMapping.js#L17-L59

// camelCase to snake_case converter that also works with
// non-ascii characters.
export default function snakeCase(str: string, upperCase: boolean = false) {
  if (str.length === 0) {
    return str;
  }

  const upper = str.toUpperCase();
  const lower = str.toLowerCase();

  let out = lower[0];

  for (let i = 1, l = str.length; i < l; ++i) {
    const char = str[i];
    const prevChar = str[i - 1];

    const upperChar = upper[i];
    const prevUpperChar = upper[i - 1];

    const lowerChar = lower[i];
    const prevLowerChar = lower[i - 1];

    // Test if `char` is an upper-case character and that the character
    // actually has different upper and lower case versions.
    if (char === upperChar && upperChar !== lowerChar) {
      // Multiple consecutive upper case characters shouldn't add underscores.
      // For example "fooBAR" should be converted to "foo_bar".
      if (prevChar === prevUpperChar && prevUpperChar !== prevLowerChar) {
        out += lowerChar;
      } else {
        out += `_${lowerChar}`;
      }
    } else {
      out += char;
    }
  }

  if (upperCase) {
    return out.toUpperCase();
  }
  return out;
}
