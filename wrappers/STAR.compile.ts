import { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
  lang: "tact",
  target: "contracts/STAR.tact",
  options: {
    debug: true,
  },
};
