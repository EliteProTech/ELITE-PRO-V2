export const ticTacToeGames = new Map()

const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
]

export function renderTicTacToeBoard(board) {
    return [0, 3, 6]
        .map(start => board.slice(start, start + 3).map((cell, index) => cell || numbers[start + index]).join(' '))
        .join('\n')
}

export function hasTicTacToeWinner(board, symbol) {
    return winningLines.some(line => line.every(position => board[position] === symbol))
}

export function playerTag(jid) {
    return `@${jid.split('@')[0]}`
}

export function resetTicTacToeTimeout(EliteProTech, game) {
    if (game.timeout) clearTimeout(game.timeout)
    game.timeout = setTimeout(async () => {
        if (ticTacToeGames.get(game.chat) !== game) return
        ticTacToeGames.delete(game.chat)
        await EliteProTech.sendMessage(game.chat, {
            text: '⌛ *X AND O*\n\nThe game ended because there were no moves for 10 minutes.'
        }).catch(() => {})
    }, 10 * 60 * 1000)
}

export function finishTicTacToe(game) {
    if (game.timeout) clearTimeout(game.timeout)
    ticTacToeGames.delete(game.chat)
}
