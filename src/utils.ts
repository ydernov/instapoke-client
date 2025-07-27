import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const cn: typeof twMerge = (...inputs) => twMerge(clsx(inputs));
