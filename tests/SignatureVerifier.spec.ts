import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell } from '@ton/core';
import { SignatureVerifier } from '../wrappers/SignatureVerifier';
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';
import '@ton/test-utils';

describe('SignatureVerifier', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let signer: SandboxContract<TreasuryContract>;
    let signatureVerifier: SandboxContract<SignatureVerifier>;
    //服务器测试私钥
    let mnemonic: string[];
    //部署合约
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        signer = await blockchain.treasury('signer');
        mnemonic = await mnemonicNew();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);
        signatureVerifier = blockchain.openContract(await SignatureVerifier.fromInit(publicKeyBigInt));

        const deployResult = await signatureVerifier.send(
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
            to: signatureVerifier.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jetton are ready to use
        const isPass = await signatureVerifier.getIsPass();
        expect(isPass).toBe(false);
    });

    it('should pass the signature verifier', async () => {
        //server sign the message and send to front end
        let user = await blockchain.treasury('user');
        let withdrawAmount: bigint = 1000000000n;
        const signatureData = beginCell().storeAddress(user.address).storeCoins(withdrawAmount).endCell();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        const signature = sign(signatureData.hash(), keyPair.secretKey);
        let signatureCell = beginCell().storeBuffer(signature).endCell();
        //user get the signature and send tx to contract
        await signatureVerifier.send(
            user.getSender(),
            {
                value: toNano('0.01'),
            },
            { $$type: 'WithDraw', amount: withdrawAmount, receiver: user.address, signature: signatureCell },
        );
        //签名验证通过
        const isPass = await signatureVerifier.getIsPass();
        expect(isPass).toBe(true);
    });
});
