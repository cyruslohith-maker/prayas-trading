// This file tricks the browser into thinking it has a file system.
export const statSync = () => ({
  isFile: () => false,
  isDirectory: () => false,
});

export const createReadStream = () => {
  throw new Error("Cannot read files in the browser!");
};

export const promises = {
  readFile: async () => "",
  writeFile: async () => {},
};

export const readFileSync = () => "";
export const existsSync = () => false;

export default {
  statSync,
  createReadStream,
  promises,
  readFileSync,
  existsSync,
};