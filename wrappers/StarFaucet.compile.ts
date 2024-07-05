import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/StarFaucet.tact',
    options: {
        debug: true,
    },
};
