import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell } from '@ton/core';
import { StarFaucet } from '../wrappers/StarFaucet';
import { STAR } from '../wrappers/STAR';
import { JettonDefaultWallet } from '../wrappers/JettonDefaultWallet';
import '@ton/test-utils';
describe('SignatureVerifier', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let starFaucet: SandboxContract<StarFaucet>;
    let star: SandboxContract<STAR>;
    let userTom: SandboxContract<TreasuryContract>;
    let userTomJettonDefaultWallet: SandboxContract<JettonDefaultWallet>;
    //部署合约
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        userTom = await blockchain.treasury('userTom');
        starFaucet = blockchain.openContract(await StarFaucet.fromInit());

        //部署STAR
        star = blockchain.openContract(await STAR.fromInit(deployer.address, beginCell().endCell(), 10000000000n));

        const deploySTARResult = await star.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deploySTARResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: star.address,
            deploy: true,
            success: true,
        });
        //获取合约的jettonWallet地址
        const jettonWalletAddress = await star.getGetWalletAddress(starFaucet.address);
        //deploy
        const deployResult = await starFaucet.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
                jettonWalletAddress: jettonWalletAddress,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: starFaucet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy success', async () => {});
    it('should claim success', async () => {
        //mint to Faucet contract
        await star.send(
            deployer.getSender(),
            {
                value: toNano('0.02'),
            },
            {
                $$type: 'Mint',
                receiver: starFaucet.address,
                amount: 1000000000n,
            },
        );
        //claim the star token
        await starFaucet.send(
            userTom.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Claim',
            },
        );
        //check the token balance
        const limitAmount = 1000000n;
        userTomJettonDefaultWallet = blockchain.openContract(
            await JettonDefaultWallet.fromInit(star.address, userTom.address),
        );
        // const userTomWalletData = await userTomJettonDefaultWallet.getGetWalletData();
        // expect(userTomWalletData.balance).toBe(limitAmount);
        await userTomJettonDefaultWallet.send(
            userTom.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'TokenBurn',
                queryId: 0n,
                amount: limitAmount,
                owner: userTom.address,
                response_destination: userTom.address,
            },
        );

        const userTomWalletData = await userTomJettonDefaultWallet.getGetWalletData();
        expect(userTomWalletData.balance).toBe(0n);
    });
});