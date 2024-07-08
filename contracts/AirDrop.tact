import "@stdlib/ownable";

contract AirDrop {
    publicKey: Int?;
    jettonWalletAddress: Address?;
    isClaim: map<Address, Bool>;

    receive(deploy: Deploy){
        self.jettonWalletAddress = deploy.jettonWalletAddress;
        self.publicKey = deploy.publicKey;
        self.notify(DeployOk{queryId: deploy.queryId}.toCell());
    }
    /// user claim the airdrop
    /// the claim amount and receiver are checked by server logic
    /// - Parameters:
    ///   - amount: claim amount
    ///   - receiver: airdrop receiver
    ///   - signature: sign by private key on server
    receive(msg: Claim){
        let msgHash: Int = self.getMessageHash(msg.amount, msg.receiver);
        let isValid: Bool = checkSignature(msgHash, msg.signature, self.publicKey!!);
        if (isValid) {
            let isClaimed: Bool? = self.isClaim.get(msg.receiver);
            if (isClaimed != null) {
                let isClaimedValue: Bool = self.isClaim.get(msg.receiver)!!;
                require(!(isClaimedValue), "already claimed");
            }
            //only claim once
            self.isClaim.set(msg.receiver, true);
            //send the token to user
            send(SendParameters{
                    to: self.jettonWalletAddress!!,
                    value: 0,
                    bounce: false,
                    mode: (SendRemainingValue + SendIgnoreErrors),
                    body: TokenTransfer{
                        queryId: 0,
                        amount: msg.amount,
                        destination: msg.receiver,
                        response_destination: msg.receiver,
                        custom_payload: null,
                        forward_ton_amount: 0,
                        forward_payload: emptySlice()
                    }.toCell()
                }
            );
        }
    }

    // fun checkSignature(hash: Int, signature: Slice, public_key: Int): Bool;
    // 获取消息hash信息
    fun getMessageHash(amount: Int, receiver: Address): Int {
        let signatureData: Cell = beginCell().storeAddress(receiver).storeCoins(amount).endCell();
        return signatureData.hash();
    }

    get fun isClaim(receiver: Address): Bool{
        let isClaimed: Bool? = self.isClaim.get(receiver);
        if (isClaimed != null) {
            let isClaimedValue: Bool = self.isClaim.get(receiver)!!;
            if(isClaimedValue){
                return true;
            }
        }
        return false;
    } 
}

message Claim {
    amount: Int;
    receiver: Address;
    signature: Slice;
}
message Deploy {
    queryId: Int as uint64;
    jettonWalletAddress: Address;
    publicKey: Int;
}
message DeployOk {
  queryId: Int as uint64;
}
message(0xf8a7ea5) TokenTransfer {
  queryId: Int as uint64;
  amount: Int as coins;
  destination: Address;
  response_destination: Address;
  custom_payload: Cell?;
  forward_ton_amount: Int as coins;
  forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}
