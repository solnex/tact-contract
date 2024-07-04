import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/SignatureVerifier.tact',
    options: {
        debug: true,
    },
};
