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
