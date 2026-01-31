// This file bypasses the Google Cloud environment check
export async function isAvailable() {
  return false;
}

export async function instance() {
  return {};
}