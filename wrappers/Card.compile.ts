
import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/Card.tact',
    options: {
        debug: true,
    },
};
