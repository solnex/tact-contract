message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}
message Claim {
}
message Deploy {
    queryId: Int as uint64;
    jettonWalletAddress: Address;
}
message DeployOk {
    queryId: Int as uint64;
}
message(0x7362d09c) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

contract StarFaucet {
    //初始化
    isClaim: map<Address, Bool>;
    jettonWalletAddress: Address?;
    limitAmount: Int = 1000000;

    receive(deploy: Deploy){
        self.jettonWalletAddress = deploy.jettonWalletAddress;
        self.notify(DeployOk{queryId: deploy.queryId}.toCell());
    }

    receive(msg: TokenNotification){}

    receive(msg: Claim){
        //验证是否领取过
        let ctx: Context = context();
        let isClaimed: Bool = self.isClaim.get(ctx.sender)!!;
        require(isClaimed, "already claimed");

        //验证余额

        //更改map
        self.isClaim.set(ctx.sender, true);
        //发送代币
        send(SendParameters{
                to: self.jettonWalletAddress!!,
                value: 0,
                bounce: false,
                mode: (SendRemainingValue + SendIgnoreErrors),
                body: TokenTransfer{
                    queryId: 0,
                    amount: self.limitAmount,
                    destination: ctx.sender,
                    response_destination: ctx.sender,
                    custom_payload: null,
                    forward_ton_amount: ton("0.01"),
                    forward_payload: emptySlice()
                }.toCell()
            }
        );
    }
}