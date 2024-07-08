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
					Accounts: {
						Address: string;
						IsWritable: any;
						Token: { Mint: any; Owner: any; ProgramId: any };
					}[];
				};
			}[];
		};
	},
	address: string,
	tokenMeta: { name: string; symbol: string },
	score: string,
	isFreeze: boolean,
	isMint: boolean,
	lp: number,
	lpLocked: number,
	largeLpUnlocked: boolean,
) {
	let message = `🔥 New Token \n
*Block Time:* ${convertToUTC7(data.Solana.Instructions[0].Block.Time)}\n
*Name:* ${tokenMeta?.name} - ${tokenMeta?.symbol}\n
*Liquid Pool*: ${lp}$\n
*Liquid Pool Locked*: ${lpLocked}$\n

*Address:* [https://dexscreener.com/search?q=${address}](${address})\n`;

	message += '*Risk:*\n';
	message += `*Score:* ${score}\n`;
	message += `Freeze Revoked: ${isFreeze ? `✅` : '❌'} \n`;
	message += `Mint Revoked: ${isMint ? `✅` : '❌'} \n`;
	message += `Large Liquid Unlocked: ${largeLpUnlocked ? `✅` : '❌'} \n`;

	message += `=> ${
		parseFloat(score) <= 800 && parseFloat(score) !== 0
			? 'GOOD ✅'
			: 'Danger ❌'
	}\n`;
	return message;
}
