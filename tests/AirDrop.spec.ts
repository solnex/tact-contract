import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell } from '@ton/core';
import { AirDrop } from '../wrappers/AirDrop';
import { STAR } from '../wrappers/STAR';
import { JettonDefaultWallet } from '../wrappers/JettonDefaultWallet';
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';
import '@ton/test-utils';
describe('AirDrop', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let airDrop: SandboxContract<AirDrop>;
    let star: SandboxContract<STAR>;
    let userTom: SandboxContract<TreasuryContract>;
    let userTomJettonDefaultWallet: SandboxContract<JettonDefaultWallet>;

     //服务器测试私钥
     let mnemonic: string[];
    //部署合约
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        userTom = await blockchain.treasury('userTom');
        airDrop = blockchain.openContract(await AirDrop.fromInit());

        mnemonic = await mnemonicNew();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);
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
        const jettonWalletAddress = await star.getGetWalletAddress(airDrop.address);
        //deploy
        const deployResult = await airDrop.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
                jettonWalletAddress: jettonWalletAddress,
                publicKey: publicKeyBigInt
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: airDrop.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy success', async () => {});
    it('should airDrop success', async () => {
        //mint to airDrop contract
        const mintAmount = 1000000000n;
        await star.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Mint',
                receiver: airDrop.address,
                amount: mintAmount,
            },
        );
        const airDropJettonDefaultWallet = blockchain.openContract(
            await JettonDefaultWallet.fromInit(star.address, airDrop.address),
        );
        const airDropWalletData = await airDropJettonDefaultWallet.getGetWalletData();
        expect(airDropWalletData.balance).toBe(mintAmount);
        
        //get the signature from mock server
        let airDropAmount: bigint = 1000000000n;
        const signatureData = beginCell().storeAddress(userTom.address).storeCoins(airDropAmount).endCell();
        const keyPair = await mnemonicToWalletKey(mnemonic);
        const signature = sign(signatureData.hash(), keyPair.secretKey);
        let signatureCell = beginCell().storeBuffer(signature).endCell();
        
        // claim the star token from airdrop contract
        let isClaimed = await airDrop.getIsClaim(userTom.address);
        expect(isClaimed).toBe(false);

        await airDrop.send(
            userTom.getSender(),
                                                                                                       {
                value: toNano('1'),
            },
            {
                $$type: 'Claim',
                amount: airDropAmount,
                receiver: userTom.address,
                signature: signatureCell
            },
        );

        //check the token balance
        userTomJettonDefaultWallet = blockchain.openContract(
            await JettonDefaultWallet.fromInit(star.address, userTom.address),
        );
        const userTomWalletData = await userTomJettonDefaultWallet.getGetWalletData();
        expect(userTomWalletData.balance).toBe(airDropAmount);

        isClaimed = await airDrop.getIsClaim(userTom.address);
        expect(isClaimed).toBe(true);
     
    });
});
