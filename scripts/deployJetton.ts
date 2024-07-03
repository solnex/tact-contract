// import { toNano } from '@ton/core';
// import { STAR } from '../wrappers/STAR';
// import { NetworkProvider } from '@ton/blueprint';

// export async function run(provider: NetworkProvider) {
//     const STAR = provider.open(await STAR.fromInit(BigInt(Math.floor(Math.random() * 10000))));

//     await STAR.send(
//         provider.sender(),
//         {
//             value: toNano('0.05'),
//         },
//         {
//             $$type: 'Deploy',
//             queryId: 0n,
//         },
//     );

//     await provider.waitForDeploy(STAR.address);

//     console.log('ID', await STAR.getId());
// }
