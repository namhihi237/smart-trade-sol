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
	return !tokenData?.risks?.filter((risk: { name: string }) => risk.name === 'Freeze Authority still enabled').length;
}

export function isMintRevoked(tokenData: any) {
	return !tokenData?.risks?.filter((risk: { name: string }) => risk.name === 'Mint Authority still enabled').length;
}

export function getMetaDataToken(tokeData: { tokenMeta: any }) {
	return tokeData?.tokenMeta;
}

export function getScore(tokeData: { score: any }) {
	return tokeData?.score || -1;
}
