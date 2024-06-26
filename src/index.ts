import { getTokenAddress } from './utils/bit-query';
import { createClient } from 'redis';

const Queue = require('bull');
import {
	checkRugToken,
	getLp,
	getLpLocked,
	getMetaDataToken,
	getScore,
	isFreezeRevoked,
	isLargeLpUnlocked,
	isMintRevoked,
} from './utils/check-rug';
import { buildMessageNewToken, sendMessageToChannel } from './utils/telegram';

const client = await createClient({
	url: `redis://:${Bun.env.REDIS_PASSWORD}@${Bun.env.REDIS_HOST}:${Bun.env.REDIS_PORT}`,
})
	.on('error', (err) => console.log('Redis Client Error', err))
	.connect();

await client.set('test', 'test');

const { WebSocket } = require('ws');
const sendMessageQueue = new Queue('send-message-queue');

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
	try {
		const response = JSON.parse(data);
		if (response.type === 'data') {
			// Broadcast the data to all connected clients of your local server
			const data = response?.payload?.data;

			if (!data) return;

			console.log('Received data from Bitquery', new Date());

			const tokenAddress = getTokenAddress(data);
			sendMessageQueue.add({ data, tokenAddress }, { delay: 0.5 * 60 * 1000 });
		}
	} catch (error) {
		console.log(error);
	}
});

sendMessageQueue.process(async (job: { data: { tokenAddress: any; data: any } }) => {
	try {
		console.log('sendMessageQueue process:', new Date());

		const { tokenAddress, data } = job.data;
		const rugData = await checkRugToken(tokenAddress);
		console.log(rugData);

		const tokenMetadata = getMetaDataToken(rugData);
		const score = getScore(rugData);
		const isFreeze = isFreezeRevoked(rugData);
		const isMint = isMintRevoked(rugData);
		const lp = getLp(rugData);
		const largeLpUnlocked = isLargeLpUnlocked(rugData);

		const lpLocked = getLpLocked(rugData);
		// Call the function to send the message to the channel
		let message = buildMessageNewToken(
			data,
			tokenAddress,
			tokenMetadata,
			score,
			isFreeze,
			isMint,
			lp,
			lpLocked,
			largeLpUnlocked,
		);
		await sendMessageToChannel(message);
	} catch (error) {
		console.error('Error processing job:', error);
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
