import { diff } from "json-diff";
import { cleanDiff } from 'graphql-clean-diff';

import * as chalk from "chalk";

interface Json {
  [key: string]: string | number | boolean | null | Json[] | Json;
}

class ASCIIDiffFormatter {
  private a: Json;
  private config: {
    showArrayIndices: boolean;
    color?: string;
  };

  constructor(a: Json, config?: Partial<ASCIIDiffFormatter["config"]>) {
    this.a = a;
    this.config = {
      showArrayIndices: true,
      color: 'white',
      ...config,
    };
  }

  private colorize(str: string, color: string): string {
    if (color && typeof chalk[color] === 'function') {
      return chalk[color](str);
    } else {
      return str;
    }
  }

  private formatValue(value: any): string {
    if (Array.isArray(value)) {
      return `[${value.join(", ")}]`;
    } else if (value && typeof value === "object") {
      const keys = Object.keys(value);
      return keys.map(key => {
        if (key === '__old' && typeof value[key] === 'string') {
          return this.colorize(value[key], 'red');
        } else if (key === '__new' && typeof value[key] === 'string') {
          return this.colorize(value[key], 'green');
        } else {
          return `${key}: ${this.formatValue(value[key])}`;
        }
      }).join(", ");
    } else {
      return String(value);
    }
  }

  public format(diffs: any[]): string {
    const output: string[] = [];

    diffs.forEach((diff: any) => {
      const valueString = this.formatValue(diff);
      output.push(valueString);
    });

    return output.join("\n");
  }
}

export function DiffPatchChangesAgainstCurrentObj(
  patchConfig: string,
  apiConfig: string | Json
): string | object | null {
  const currAPIJSON = typeof apiConfig === "string" ? JSON.parse(apiConfig) : apiConfig;
  const patchConfigJSON = typeof patchConfig === "string" ? JSON.parse(patchConfig) : patchConfig;

  // const d = diff(currAPIJSON, patchConfigJSON, { full: true });

  const d = cleanDiff(currAPIJSON, patchConfigJSON);

  if (!d) {
    return null;
  }

  // const aJSON = currAPIJSON;
  // const config = {
  //   showArrayIndices: true,
  //   color: 'white',
  // };

  // const formatter = new ASCIIDiffFormatter(aJSON, config);
  // const diffString = formatter.format([d]);

  // return diffString;

  return d;
}