export function suppressSignalLogs() {
    const originalConsoleLog = console.log
    console.log = (...args) => {
        const first = args[0]
        if (typeof first === 'string' && (
            first.startsWith('Closing session') ||
            first.startsWith('Closing stale open session') ||
            first.startsWith('Closing open session')
        )) {
            return
        }
        originalConsoleLog(...args)
    }
}
