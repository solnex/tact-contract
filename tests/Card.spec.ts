import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { Card} from '../wrappers/Card';
import { NftItem} from '../wrappers/NftItem';
import '@ton/test-utils';

describe('Card', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let card: SandboxContract<Card>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
          
        card = blockchain.openContract(await Card.fromInit(deployer.address, 
            beginCell().endCell(), 
             { 
                $$type:'RoyaltyParams',
                numerator: 1n,
                denominator: 1000n,
                destination: deployer.address}));

        const deployResult = await card.send(
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
            to: card.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy card contract', async () => {
        const collectionData = await card.getGetCollectionData();
        expect(collectionData.owner_address.toString()).toEqual(deployer.address.toString())
    });

    it('should mint success', async () => {
        let minter = await blockchain.treasury('minter');
        await card.send( 
            minter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Mint'  
        );
         const nftIndex = 0n;
         const nftItem = blockchain.openContract(await NftItem.fromInit(card.address, nftIndex));
         const nftData = await nftItem.getGetNftData();
         expect(nftData.owner_address.toString()).toEqual(minter.address.toString());
    })

    it('should transfer success', async () => {
        let minter = await blockchain.treasury('minter');
        await card.send( 
            minter.getSender(),
            {
                value: toNano('0.1'),
            },
            'Mint'  
        );
        let receiver = await blockchain.treasury('reveiver');
        const nftIndex = 0n;
        const nftItem = blockchain.openContract(await NftItem.fromInit(card.address, nftIndex));
        await nftItem.send(
            minter.getSender(),
            {
                value: toNano('0.1')
            },
            {
                $$type:"Transfer",
                query_id: 0n,
                new_owner: receiver.address,
                response_destination: null,
                custom_payload: null,
                forward_amount: 0n,
                forward_payload: beginCell().endCell()
            }   
        )

        const nftData = await nftItem.getGetNftData();
        expect(nftData.owner_address.toString()).toEqual(receiver.address.toString());
    })
});
