import {
    ticTacToeGames,
    playerTag,
    renderTicTacToeBoard,
    resetTicTacToeTimeout
} from '../../lib/tictactoe.js'

let handler = async (m, { EliteProTech }) => {
    if (ticTacToeGames.has(m.chat)) {
        return await m.reply('A Tic-Tac-Toe game is already active in this group. Reply to its latest board to play.')
    }

    const game = {
        chat: m.chat,
        players: [m.sender],
        symbols: { [m.sender]: '❌' },
        board: Array(9).fill(''),
        turn: m.sender,
        messageId: null,
        timeout: null
    }

    const sent = await EliteProTech.sendMessage(m.chat, {
        text: `🎮 *X AND O*\n\n❌ ${playerTag(m.sender)}\n⭕ Waiting for another player...\n\n${renderTicTacToeBoard(game.board)}\n\n↪️ Reply to this message to join.`,
        mentions: [m.sender]
    }, { quoted: m })

    game.messageId = sent.key.id
    ticTacToeGames.set(m.chat, game)
    resetTicTacToeTimeout(EliteProTech, game)
}

handler.command = ['xo', 'ttt', 'tictactoe']
handler.group = true

export default handler
