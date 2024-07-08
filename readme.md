## tact合约

本仓库计划由tact语言实现常用的合约功能，如空投，多签钱包，时间锁，代币水龙头，荷兰拍，链上随机数，nft交易所等

### STAR代币合约

ton上的同质化代币标准和etherum上的erc20有所不同，它将合约分为两层，主合约master，和低级合约jettonWallet，主合约master为工厂合约，用户一旦首次持有某个同质化jetton代币，便会调用master合约部署一个该代币的jettonWallet合约，该合约的owner为用户的钱包合约地址，jettonWallet合约地址由主合约生成，当转移代币时，需调用jettonWallet合约发起transfer交易。

#### TokenTransfer

发送方接口

```
message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;             // 收据id 可以自定义用于区分交易
    amount: Int as coins;               // 数量
    destination: Address;               // 目的地址
    response_destination: Address;      // 交易完成后回复地址，可以不设
    custom_payload: Cell?;              // 负载
    forward_ton_amount: Int as coins;   // Must be > 0 if you want to send transfer notification message with forward payload.
    forward_payload: Slice as remaining;// Comment Text message when Transfer the jetton
}

```

#### TokenTransferInternal

接收方接口

```
message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}
```

### SignatureVerifier合约

数字签名验证合约，可用于空投合约的数据验证。
空投合约主要流程

1. 用户在前端发起提取，前端发起http请求到后端，传出
   参数为用户的地址以及数量
2. 后端服务器用私钥签名，并将签名传给前端，
3. 用户发起交易，将提取数据以及签名传给
   合约
4. 合约用公钥解密，验证通过后，将代币发送给接收方

#### 服务端签名

```
import { sign } from 'ton-crypto';
const signature = sign(signatureData.hash(), keyPair.secretKey);

```

#### 合约端验证签名

```
fun checkSignature(hash: Int, signature: Slice, public_key: Int): Bool;
```

#### 其他

```
 //将buffer转化为bigint类型
 let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

 //将buffer转化为cell类型
 let signatureCell = beginCell().storeBuffer(signature).endCell();
```

### StarFaucet水龙头合约

jetton的发送是通过调用jettonWallet的transfer方法实现的，所以应该将合约的jettonWallet地址
告知写入合约。注意的是，本合约的地址是在部署前就可以通过初始化参数生成的，而jettonWallet地址只能在
知道合约地址的情况下生成，所以不能作为初始化参数，只能通过部署交易配置给合约。而部署交易是合约的第一个
交易，其目的是激活合约，所有合约都通过发送其他消息来部署。

### AirDrop合约
主要逻辑结合了水龙头合约以及数字签名验证

空投合约主要流程
1. 用户在前端发起提取，前端发起请求到后端，传出
   参数为用户的地址以及数量
2. 后端服务器用私钥签名，并将签名传给前端，
3. 用户发起交易，将提取数据以及签名传给
   合约
4. 合约用公钥解密，验证通过后，将jetton代币发送给接收方