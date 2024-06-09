const axios = require('axios');

// Function to check for a rug token
export async function checkRugToken(tokenAddress: string) {
	const url = `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`;

	try {
		const response = await axios.get(url);
		return response.data; // Returning the data for further processing
	} catch (error) {
		console.error('Failed to fetch token report:');
		return null; // Return null or handle the error as needed
	}
}

export function isFreezeRevoked(tokenData: any) {
	if (!tokenData) return false;
	return !tokenData?.risks?.filter((risk: { name: string }) => risk.name === 'Freeze Authority still enabled').length;
}

export function isMintRevoked(tokenData: any) {
	if (!tokenData) return false;
	return !tokenData?.risks?.filter((risk: { name: string }) => risk.name === 'Mint Authority still enabled').length;
}

export function isLargeLpUnlocked(tokenData: {
	risks: { filter: (arg0: (risk: { name: string }) => boolean) => { (): any; new (): any; length: any } };
}) {
	if (!tokenData) return false;
	return !tokenData?.risks?.filter((risk: { name: string }) => risk.name === 'Large Amount of LP Unlocked').length;
}

export function getMetaDataToken(tokeData: { tokenMeta: any }) {
	if (!tokeData) return 'N/A';
	return tokeData?.tokenMeta;
}

export function getScore(tokeData: { score: any }) {
	return tokeData?.score || -1;
}

export function getLp(tokeData: { markets: { lp: { baseUSD: any; quoteUSD: any } }[] }) {
	if (!tokeData || !tokeData.markets || !tokeData.markets[0] || !tokeData.markets[0].lp) {
		return 0;
	}
	return tokeData.markets[0].lp.quoteUSD || tokeData.markets[0].lp.baseUSD || 0;
}

export function getLpLocked(tokeData: { markets: { lp: { lpLockedUSD: any } }[] }) {
	if (!tokeData || !tokeData.markets || !tokeData.markets[0] || !tokeData.markets[0].lp) {
		return 0;
	}
	return tokeData.markets[0].lp.lpLockedUSD || 0;
}
