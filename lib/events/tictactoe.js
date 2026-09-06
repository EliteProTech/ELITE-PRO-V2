import { smsg } from '../myfunc.js'
import {
    ticTacToeGames,
    finishTicTacToe,
    hasTicTacToeWinner,
    playerTag,
    renderTicTacToeBoard,
    resetTicTacToeTimeout
} from '../tictactoe.js'

async function sendBoard(EliteProTech, game, quoted, text) {
    const sent = await EliteProTech.sendMessage(game.chat, {
        text,
        mentions: game.players
    }, { quoted })
    game.messageId = sent.key.id
}

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify' && type !== 'append') return

    for (const raw of messages || []) {
        if (!raw?.message || raw.key?.remoteJid === 'status@broadcast') continue

        let m
        try {
            m = await smsg(EliteProTech, raw)
        } catch {
            continue
        }

        const game = ticTacToeGames.get(m.chat)
        if (!game || m.quoted?.id !== game.messageId) continue

        const sender = m.sender

        if (game.players.length === 1) {
            if (sender === game.players[0]) continue

            game.players.push(sender)
            game.symbols[sender] = '⭕'
            await sendBoard(
                EliteProTech,
                game,
                m,
                `🎮 *X AND O*\n\n❌ ${playerTag(game.players[0])}\n⭕ ${playerTag(game.players[1])}\n\n${renderTicTacToeBoard(game.board)}\n\n🎮 *Game started!*\n❌ ${playerTag(game.turn)}'s turn.\n↪️ Reply with a number from 1-9.`
            )
            resetTicTacToeTimeout(EliteProTech, game)
            continue
        }

        if (!game.players.includes(sender)) continue

        if (sender !== game.turn) {
            await EliteProTech.sendMessage(game.chat, {
                text: `⏳ It is ${playerTag(game.turn)}'s turn.`,
                mentions: [game.turn]
            }, { quoted: m })
            continue
        }

        const position = Number.parseInt(m.text.trim(), 10) - 1
        if (!Number.isInteger(position) || position < 0 || position > 8) {
            await m.reply('❌ Invalid move. Reply with a number from 1-9.')
            continue
        }

        if (game.board[position]) {
            await m.reply('❌ That position is already occupied.')
            continue
        }

        const symbol = game.symbols[sender]
        game.board[position] = symbol

        if (hasTicTacToeWinner(game.board, symbol)) {
            await EliteProTech.sendMessage(game.chat, {
                text: `🎮 *X AND O*\n\n${renderTicTacToeBoard(game.board)}\n\n🏆 ${symbol} ${playerTag(sender)} *WINS!*`,
                mentions: [sender]
            }, { quoted: m })
            finishTicTacToe(game)
            continue
        }

        if (game.board.every(Boolean)) {
            await EliteProTech.sendMessage(game.chat, {
                text: `🎮 *X AND O*\n\n${renderTicTacToeBoard(game.board)}\n\n🤝 *DRAW!*`
            }, { quoted: m })
            finishTicTacToe(game)
            continue
        }

        game.turn = game.players.find(player => player !== sender)
        await sendBoard(
            EliteProTech,
            game,
            m,
            `🎮 *X AND O*\n\n${renderTicTacToeBoard(game.board)}\n\n${symbol} ${playerTag(sender)} played.\n➡️ Turn: ${game.symbols[game.turn]} ${playerTag(game.turn)}\n↪️ Reply with a number from 1-9.`
        )
        resetTicTacToeTimeout(EliteProTech, game)
    }
}

handler.on = 'messages.upsert'

export default handler
