import { getTokenAddress } from './utils/bit-query';
import { checkRugToken, getMetaDataToken, getScore, isFreezeRevoked, isMintRevoked } from './utils/check-rug';
import { buildMessageNewToken, sendMessageToChannel } from './utils/telegram';

const { WebSocket } = require('ws');

const bitqueryConnection = new WebSocket(
	`wss://streaming.bitquery.io/eap?token=${Bun.env.BITQUERY_TOKEN}`,
	['graphql-ws'],
	{
		headers: {
			'Sec-WebSocket-Protocol': 'graphql-ws',
			'Content-Type': 'application/json',
		},
	},
);

// Function to convert UTC time to UTC+7

const lps = ['0xc74b026fab49d2380ffc6f53908c2ae6d14aa3b6'];

bitqueryConnection.on('open', () => {
	console.log('Connected to Bitquery.');

	// Send initialization message
	const initMessage = JSON.stringify({ type: 'connection_init' });
	bitqueryConnection.send(initMessage);

	// After initialization, send the actual subscription message
	setTimeout(() => {
		const message = JSON.stringify({
			type: 'start',
			id: '1',
			payload: {
				query: `
              subscription {
                Solana {
                  Instructions(
                    where: {Transaction: {Result: {Success: true}}, Instruction: {Program: {Method: {is: "initializeUserWithNonce"}, Address: {is: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"}}}}
                    orderBy: {descending: Block_Time}
                    limit: {count: 1}
                  ) {
                    Block {
                      Time
                      Date
                    }
                    Instruction {
                      Accounts {
                        Address
                        IsWritable
                        Token {
                          Mint
                          Owner
                          ProgramId
                        }
                      }
                    }
                  }
                }
              }
                `,
				variables: { lps },
			},
		});

		bitqueryConnection.send(message);
	}, 1000);
});

bitqueryConnection.on('message', async (data: string) => {
	const response = JSON.parse(data);
	if (response.type === 'data') {
		// Broadcast the data to all connected clients of your local server
		const data = response?.payload?.data;

		if (!data) return;

		console.log('Received data from Bitquery');

		const tokenAddress = getTokenAddress(data);

		const rugData = await checkRugToken(tokenAddress);

		const tokenMetadata = getMetaDataToken(rugData);
		const score = getScore(rugData);
		const isFreeze = isFreezeRevoked(rugData);
		const isMint = isMintRevoked(rugData);

		let message = buildMessageNewToken(data, tokenAddress, tokenMetadata, score, isFreeze, isMint);

		sendMessageToChannel(message);
	}
});

bitqueryConnection.on('close', () => {
	console.log('Disconnected from Bitquery.');
});

bitqueryConnection.on('error', (error: any) => {
	console.error('WebSocket Error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
	console.log('Process interrupted. Closing WebSocket...');
	bitqueryConnection.close();
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('Process terminated. Closing WebSocket...');
	bitqueryConnection.close();
	process.exit(0);
});
