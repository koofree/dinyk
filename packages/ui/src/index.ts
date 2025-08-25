import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

export { cn };
export * from "./button";
export * from "./card";
export * from "./badge";
export * from "./tabs";
export * from "./alert";
export * from "./slider";
export * from "./scroll-area";
export * from "./progress";
export * from "./input";
export * from "./label";
export * from "./dropdown-menu";
export * from "./form";
export * from "./toast";
export * from "./theme";
