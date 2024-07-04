import "@stdlib/ownable";
import "@stdlib/deploy";
message WithDraw {
    amount: Int;
    receiver: Address;
    signature: Slice;
}

contract SignatureVerifier with Deployable {
    publicKey: Int;
    isPass: Bool;
    init(publicKey: Int){
        self.publicKey = publicKey;
        self.isPass = false;
    }

    receive(msg: WithDraw){
        let msgHash: Int = self.getMessageHash(msg.amount, msg.receiver);
        let isValid: Bool = checkSignature(msgHash, msg.signature, self.publicKey);
        if (isValid) {
            self.isPass = true;
        }
    }

    // fun checkSignature(hash: Int, signature: Slice, public_key: Int): Bool;
    // 获取消息hash信息
    fun getMessageHash(amount: Int, receiver: Address): Int {
        let signatureData: Cell = beginCell().storeAddress(receiver).storeCoins(amount).endCell();
        return signatureData.hash();
    }

    get fun IsPass(): Bool {
        return self.isPass;
    }
}