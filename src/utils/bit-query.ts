export function getTokenAddress(data: {
	Solana: { Instructions: { Instruction: { Accounts: { Address: any }[] } }[] };
}) {
	const index =
		data?.Solana?.Instructions[0]?.Instruction?.Accounts[8]?.Address !== 'So11111111111111111111111111111111111111112'
			? 8
			: 4;
	return data?.Solana?.Instructions[0]?.Instruction?.Accounts[index]?.Address;
}
