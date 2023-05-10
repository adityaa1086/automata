export interface InputData {
  input: string;
  [key: string]: unknown;
}

export async function input(
  msg: Record<string, unknown>,
  data: InputData
): Promise<Record<string, unknown>> {
  console.log('🧮 Running input node');
  return new Promise((resolve, reject) => {
    if (!data.input || typeof data.input !== 'string') {
      reject(new Error('data.input is not a string'));
    }
    resolve({ ...msg, payload: data.input });
  });
}
