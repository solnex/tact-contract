import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { STAR } from '../wrappers/STAR';
import '@ton/test-utils';

describe('STAR', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jetton: SandboxContract<STAR>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        jetton = blockchain.openContract(await STAR.fromInit(deployer.address, beginCell().endCell(), 10000000000n));

        const deployResult = await jetton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jetton are ready to use
    });
});
