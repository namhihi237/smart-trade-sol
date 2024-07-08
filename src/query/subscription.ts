export const solanaTokenSubscription = `
subscription {
  Solana {
    Instructions(
      where: {
        Transaction: {Result: {Success: true}},
        Instruction: {
          Program: {Method: {is: "initializeUserWithNonce"}},
          Address: {is: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"}
        }
      },
      orderBy: {descending: Block_Time},
      limit: {count: 1}
    ) {
      Block {
        Time
        Date
      }
      Instruction {
        Accounts {
          Address
          Token {
            Mint
            Owner
          }
        }
      }
    }
  }
}`;
