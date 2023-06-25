import { IMethodArguments } from '../useFlowRunner';

async function runUserScript(
  userScript: string,
  context: Record<string, unknown>
) {
  const disallowedWords = [
    'import',
    'require',
    'eval',
    'window',
    'alert',
    'document',
  ];

  for (const word of disallowedWords) {
    if (userScript.includes(word)) {
      return { error: `"${word}" is not allowed in user scripts` };
    }
  }

  userScript = '"use strict";\n' + userScript;

  let scriptFunction;
  try {
    scriptFunction = new Function('globals', 'msg', userScript);
  } catch (error) {
    console.log('🚨 Error parsing user script', error);
    return { error: 'Error parsing user script\n' + error };
  }

  let result;

  try {
    result = await scriptFunction(context.globals, context.msg);
  } catch (error) {
    console.log('🚨 Error running user script', error);
    return { error: 'Error running user script\n' + error };
  }
  return result;
}

export function userFunction({
  globals,
  inputs,
  msg,
}: IMethodArguments): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    if (typeof inputs?.userFunction === 'string') {
      runUserScript(inputs?.userFunction, { globals, msg }).then((result) => {
        resolve({ ...msg, ...result });
      });
    } else {
      resolve({
        ...msg,
        error: 'inputs.userFunction either doesnt exist or is not a string',
      });
    }
  });
}
