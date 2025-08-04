export type PickKeys<T, K extends keyof T> = K;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
