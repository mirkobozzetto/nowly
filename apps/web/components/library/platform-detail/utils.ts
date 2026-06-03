export const EXT_SOURCE = "Nowly";

let messageId = 0;

export const nextId = (): string => {
  messageId += 1;
  return `w${messageId}_${Date.now()}`;
};

export const fireAndForget = (url: string, opts?: RequestInit): void => {
  fetch(url, opts).catch(() => {});
};
