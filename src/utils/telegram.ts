import { convertToUTC7 } from './date';

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(Bun.env.TELEGRAM_BOT_TOKEN, { polling: true });
const channelId = '-1002209066926';
// Function to send a message to the channel
export function sendMessageToChannel(text: any) {
	bot
		.sendMessage(channelId, text, {
			parse_mode: 'Markdown',
		})
		.catch((error: any) => {
			console.error('Failed to send message:', error);
		});
}

export function buildMessageNewToken(
	data: {
		Solana: {
			Instructions: {
				Block: any;
				Instruction: {
					Accounts: { Address: string; IsWritable: any; Token: { Mint: any; Owner: any; ProgramId: any } }[];
				};
			}[];
		};
	},
	address: string,
	tokenMeta: { name: string; symbol: string },
	score: string,
	isFreeze: boolean,
	isMint: boolean,
) {
	let message = `✅ New Token \n
*Block Time:* ${convertToUTC7(data.Solana.Instructions[0].Block.Time)}\n
*Name:* ${tokenMeta?.name} - ${tokenMeta?.symbol}\n
*Address:* ${address}\n`;

	message += `*Score:* ${score}\n`;
	message += `Freeze Revoked: ${isFreeze ? `✅` : '❌'} \n`;
	message += `Mint Revoked: ${isMint ? `✅` : '❌'} \n`;

	message += `=> ${parseFloat(score) <= 800 ? 'GOOD ✅' : 'Danger ❌'}\n`;
	return message;
}
