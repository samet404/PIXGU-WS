import chalk from 'chalk'

export const logErr = (message: any, e: globalThis.Error) =>
  console.error(
    chalk.red(
      JSON.stringify(
        {
          message,
          e,
        },
        null,
        2,
      ),
    ),
  )
